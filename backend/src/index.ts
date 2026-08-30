import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

app.use(cors());
app.use(express.json());

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, whatsapp, accessCode } = req.body;

  try {
    // Verificamos o código de acesso
    if (!accessCode) {
      return res.status(400).json({ error: 'Código de Acesso é obrigatório.' });
    }

    const codeRecord = await prisma.accessCode.findUnique({
      where: { code: accessCode }
    });

    if (!codeRecord || codeRecord.status !== 'available') {
      return res.status(400).json({ error: 'Código de Acesso inválido ou já utilizado.' });
    }

    // Criar o usuário
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        whatsapp,
      },
    });

    // Marcar código como usado
    await prisma.accessCode.update({
      where: { id: codeRecord.id },
      data: {
        status: 'used',
        usedById: user.id
      }
    });

    // Criar assinatura de 30 dias
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    await prisma.subscription.create({
      data: {
        userId: user.id,
        expiresAt
      }
    });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, token });
  } catch (error: any) {
    console.error('Registration Error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'E-mail já cadastrado.' });
    }
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { accessCode } = req.body;

  if (!accessCode) {
    return res.status(400).json({ error: 'Código de acesso é obrigatório.' });
  }

  try {
    const codeRecord = await prisma.accessCode.findUnique({
      where: { code: accessCode.trim().toUpperCase() },
      include: { usedBy: true }
    });

    if (!codeRecord) {
      return res.status(401).json({ error: 'Código inválido ou não encontrado.' });
    }

    let user = codeRecord.usedBy;

    if (!user) {
      if (codeRecord.status !== 'available') {
        return res.status(401).json({ error: 'Este código já foi utilizado.' });
      }

      // Create new user for this code
      const defaultEmail = codeRecord.clientEmail || `${codeRecord.code.toLowerCase()}@noxus.local`;
      
      // Hash a default password (e.g. the code itself)
      const hashedPassword = await bcrypt.hash(codeRecord.code, 10);

      user = await prisma.user.create({
        data: {
          email: defaultEmail,
          password: hashedPassword,
          name: codeRecord.clientName || 'Tatuador(a)',
          whatsapp: codeRecord.clientPhone,
          role: 'USER'
        }
      });

      // Update the access code
      await prisma.accessCode.update({
        where: { id: codeRecord.id },
        data: { status: 'used', usedById: user.id }
      });

      // Give 30 days subscription
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      await prisma.subscription.create({
        data: { userId: user.id, expiresAt }
      });
    }

    // Generate token
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, token });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// Middleware de Autenticação para proteger as próximas rotas
const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token não fornecido.' });

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido.' });
  }
};

// ==========================================
// PROTECTED ROUTES (Dashboard, Clients, etc)
// ==========================================

app.get('/api/me', authenticate, async (req: any, res: any) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  res.json({ user });
});

app.get('/api/dashboard', authenticate, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = tomorrowDate.toISOString().split('T')[0];
    const currentMonth = now.toISOString().substring(0, 7); // YYYY-MM

    // Appointments (Today and Tomorrow)
    const allAppointments = await prisma.appointment.findMany({
      where: { userId },
      include: { client: { include: { anamnesis: true } } }
    });

    const todayClients = allAppointments
      .filter(a => a.date === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map(a => ({
        id: a.id,
        name: a.client?.name || "Cliente",
        time: a.startTime.substring(0,5),
        status: a.status,
        value: a.value,
        type: a.status === 'Apenas Consulta' ? 'Consulta' : 'Sessão'
      }));

    const tomorrowAppointments = allAppointments
      .filter(a => a.date === tomorrow)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map(a => ({
        id: a.id,
        name: a.client?.name || "Cliente",
        time: a.startTime.substring(0,5),
        type: a.status === 'Apenas Consulta' ? 'Consulta' : 'Sessão'
      }));

    // Missing Anamnesis Alerts
    const pendingAnamnesisAlerts = allAppointments
      .filter(a => (a.date === today || a.date === tomorrow) && (!a.client?.anamnesis || a.client.anamnesis.length === 0))
      .map(a => ({
        client_id: a.clientId,
        name: a.client?.name || "Cliente",
        date: a.date === today ? "Hoje" : "Amanhã"
      }));

    // Financials
    const transactions = await prisma.financialTransaction.findMany({
      where: { userId }
    });

    const recentPayments = transactions
      .filter(t => t.type === 'entrada')
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
      .map(t => ({
        id: t.id,
        client: t.description,
        value: `R$ ${t.value.toLocaleString('pt-BR')}`,
        date: t.date?.includes('-') ? t.date.substring(0, 10).split('-').reverse().join('/') : t.date,
        status: t.status
      }));

    const monthlyRevenue = transactions
      .filter(t => t.type === 'entrada' && t.date.startsWith(currentMonth))
      .reduce((acc, curr) => acc + curr.value, 0);

    // Chart Data (Revenue by last 7 days)
    const revenueChartData = [];
    const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const dayName = DAY_NAMES[d.getDay()];
      
      const dayTxs = transactions.filter(t => t.date === dayStr);
      const income = dayTxs.filter(t => t.type === 'entrada').reduce((acc, t) => acc + t.value, 0);
      const expense = dayTxs.filter(t => t.type === 'saida').reduce((acc, t) => acc + t.value, 0);
      
      revenueChartData.push({
        date: dayName,
        income,
        expense,
        profit: income - expense
      });
    }

    // Appointments Status Data
    let concluido = 0, agendado = 0, cancelado = 0;
    allAppointments.filter(a => a.date.startsWith(currentMonth)).forEach(a => {
      if (a.status === 'Concluído') concluido++;
      else if (a.status === 'Cancelado') cancelado++;
      else agendado++;
    });
    
    const appointmentsStatusData = [];
    if (concluido > 0) appointmentsStatusData.push({ name: "Concluídos", value: concluido, fill: "hsl(var(--success))" });
    if (agendado > 0) appointmentsStatusData.push({ name: "Agendados", value: agendado, fill: "hsl(var(--warning))" });
    if (cancelado > 0) appointmentsStatusData.push({ name: "Cancelados", value: cancelado, fill: "hsl(var(--destructive))" });

    // Other Stats
    const activeClients = await prisma.client.count({ where: { userId } });
    const anamnesisCompleted = await prisma.anamnesis.count({ where: { client: { userId } } });
    
    let pendingReceivables = 0;
    allAppointments.forEach(a => {
      if (a.status === 'Agendado') {
        pendingReceivables += Math.max(0, (a.value || 0) - (a.deposit || 0));
      }
    });

    let totalDuration = 0;
    let completedCount = 0;
    allAppointments.forEach(a => {
       if (a.status === 'Concluído' && a.startTime && a.endTime) {
         const [sh, sm] = a.startTime.split(':').map(Number);
         const [eh, em] = a.endTime.split(':').map(Number);
         let startMins = sh * 60 + sm;
         let endMins = eh * 60 + em;
         if (endMins < startMins) endMins += 24 * 60; // crossed midnight
         totalDuration += (endMins - startMins);
         completedCount++;
       }
    });
    let avgMins = completedCount > 0 ? Math.floor(totalDuration / completedCount) : 0;
    const avgTime = `${Math.floor(avgMins / 60)}h ${String(avgMins % 60).padStart(2, '0')}m`;

    res.json({
      stats: {
        sessionsToday: String(todayClients.length),
        monthlyRevenue: `R$ ${monthlyRevenue.toLocaleString('pt-BR')}`,
        activeClients: String(activeClients),
        avgTime,
        pendingReceivables: `R$ ${pendingReceivables.toLocaleString('pt-BR')}`,
        anamnesisCompleted: String(anamnesisCompleted),
        topDiscoverySource: "Instagram"
      },
      todayClients,
      recentPayments,
      revenueChartData,
      appointmentsStatusData,
      pendingAnamnesisAlerts,
      tomorrowAppointments
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ error: "Erro ao buscar dados do dashboard" });
  }
});

app.post('/api/appointments/checkout', authenticate, async (req: any, res: any) => {
  const { appointmentId, status, value, paymentMethod, name, date } = req.body;
  
  try {
    const finalStatus = status === 'Recebido' || status === 'Apenas Consulta' ? 'Concluído' : 'Cancelado';
    
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: finalStatus }
    });

    if (status === 'Recebido' && Number(value) > 0) {
      await prisma.financialTransaction.create({
        data: {
          description: `Sessão - ${name} (${paymentMethod})`,
          value: Number(value),
          type: 'entrada',
          status: 'Pago',
          date: date,
          appointmentId: appointmentId,
          userId: req.user.userId
        }
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao dar baixa na sessão" });
  }
});

// ===== FINANCIAL TRANSACTIONS =====
app.get('/api/financial', authenticate, async (req: any, res: any) => {
  try {
    const txs = await prisma.financialTransaction.findMany({
      where: { userId: req.user.userId },
      orderBy: { date: 'desc' }
    });
    res.json(txs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro" });
  }
});

app.post('/api/financial', authenticate, async (req: any, res: any) => {
  try {
    const { description, value, type, status, date } = req.body;
    const tx = await prisma.financialTransaction.create({
      data: {
        description,
        value: Number(value),
        type,
        status,
        date,
        userId: req.user.userId
      }
    });
    res.json(tx);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro" });
  }
});

app.get('/api/clients', authenticate, async (req: any, res: any) => {
  try {
    const clients = await prisma.client.findMany({
      where: { userId: req.user.userId },
      orderBy: { name: 'asc' }
    });
    // Formatar os clientes igual o Supabase fazia
    const formatted = clients.map((c: any) => ({
      ...c,
      referrer: null
    }));
    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar clientes" });
  }
});

app.post('/api/clients', authenticate, async (req: any, res: any) => {
  try {
    const { name, phone, instagram, age, avatar_url, referred_by_id } = req.body;
    
    const client = await prisma.client.create({
      data: {
        name,
        phone,
        instagram,
        age: Number(age) || 0,
        avatar_url,
        referred_by_id,
        userId: req.user.userId
      }
    });

    res.json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar cliente" });
  }
});

// ===== APPOINTMENTS =====
app.get('/api/appointments', authenticate, async (req: any, res: any) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { userId: req.user.userId },
      include: { client: { select: { name: true } } },
      orderBy: { date: 'asc' }
    });
    
    // Formatar igual ao frontend
    const formatted = appointments.map((appt: any) => ({
      id: appt.id,
      client_id: appt.clientId,
      client_name: appt.client?.name || "Cliente Desconhecido",
      date: appt.date,
      startTime: appt.startTime.substring(0, 5),
      endTime: appt.endTime.substring(0, 5),
      value: Number(appt.value),
      deposit: Number(appt.deposit),
      deposit_date: appt.depositDate,
      status: appt.status
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro" });
  }
});

// Helper for financial transactions
const syncFinancials = async (appt: any, userId: string) => {
  // Se o agendamento foi cancelado, removemos as transações relacionadas
  if (appt.status === 'Cancelado') {
    await prisma.financialTransaction.deleteMany({
      where: { appointmentId: appt.id }
    });
    return;
  }

  // 1. Lidar com o Sinal (Deposit)
  if (appt.deposit > 0) {
    const depositTx = await prisma.financialTransaction.findFirst({
      where: { appointmentId: appt.id, description: { startsWith: 'Sinal' } }
    });
    if (depositTx) {
      await prisma.financialTransaction.update({
        where: { id: depositTx.id },
        data: { value: appt.deposit, date: appt.depositDate || appt.date }
      });
    } else {
      await prisma.financialTransaction.create({
        data: {
          type: 'entrada',
          value: appt.deposit,
          description: `Sinal - ${appt.client?.name || 'Cliente'}`,
          status: 'Pago',
          date: appt.depositDate || appt.date,
          userId,
          appointmentId: appt.id
        }
      });
    }
  } else {
    // Se o sinal for zerado, deletamos a transação de sinal
    await prisma.financialTransaction.deleteMany({
      where: { appointmentId: appt.id, description: { startsWith: 'Sinal' } }
    });
  }

  // 2. Lidar com a Sessão Completa (Restante)
  // Se o usuário apenas mudar o status para "Concluído" no modal de edição sem usar o botão "Dar Baixa"
  if (appt.status === 'Concluído') {
    const sessionTx = await prisma.financialTransaction.findFirst({
      where: { appointmentId: appt.id, description: { startsWith: 'Sessão' } }
    });
    
    const remainingValue = Math.max(0, (appt.value || 0) - (appt.deposit || 0));

    if (remainingValue > 0) {
      if (sessionTx) {
        // Se a transação já existe, a atualizamos (o usuário pode ter mudado o valor total)
        await prisma.financialTransaction.update({
          where: { id: sessionTx.id },
          data: { value: remainingValue, date: appt.date }
        });
      } else {
        // Se não existir, criamos
        await prisma.financialTransaction.create({
          data: {
            type: 'entrada',
            value: remainingValue,
            description: `Sessão - ${appt.client?.name || 'Cliente'}`,
            status: 'Pago',
            date: appt.date,
            userId,
            appointmentId: appt.id
          }
        });
      }
    } else if (sessionTx) {
        // Se o remainingValue for 0 (ex: 100% pago no sinal), apaga a transação da sessão se existir
        await prisma.financialTransaction.delete({
            where: { id: sessionTx.id }
        });
    }
  } else {
     // Se não está concluído, deletamos a transação de sessão (caso ele reverta o status de Concluído para Agendado)
     await prisma.financialTransaction.deleteMany({
        where: { appointmentId: appt.id, description: { startsWith: 'Sessão' } }
     });
  }
};

app.post('/api/appointments', authenticate, async (req: any, res: any) => {
  try {
    const { client_id, date, startTime, endTime, status, value, deposit, deposit_date } = req.body;
    const appt = await prisma.appointment.create({
      data: {
        date,
        startTime,
        endTime,
        status,
        value: Number(value),
        deposit: Number(deposit),
        depositDate: deposit_date || null,
        type: "Tatuagem",
        clientId: client_id,
        userId: req.user.userId
      },
      include: { client: true }
    });

    await syncFinancials(appt, req.user.userId);
    res.json(appt);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro" });
  }
});

app.put('/api/appointments/:id', authenticate, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { client_id, date, startTime, endTime, status, value, deposit, deposit_date } = req.body;
    
    const appt = await prisma.appointment.update({
      where: { id, userId: req.user.userId },
      data: {
        date,
        startTime,
        endTime,
        status,
        value: Number(value),
        deposit: Number(deposit),
        depositDate: deposit_date || null,
        clientId: client_id
      },
      include: { client: true }
    });

    await syncFinancials(appt, req.user.userId);
    res.json(appt);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro" });
  }
});

app.delete('/api/appointments/:id', authenticate, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    
    await prisma.financialTransaction.deleteMany({
      where: { appointmentId: id }
    });

    await prisma.appointment.delete({
      where: { id, userId: req.user.userId }
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro" });
  }
});

app.get('/api/appointments/client/:clientId', authenticate, async (req: any, res: any) => {
  try {
    const { clientId } = req.params;
    const appointments = await prisma.appointment.findMany({
      where: { clientId, userId: req.user.userId },
      orderBy: { date: 'desc' }
    });
    res.json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro" });
  }
});

// ===== CLIENTS (cont) =====
app.get('/api/clients/:clientId/referrals', authenticate, async (req: any, res: any) => {
  try {
    const { clientId } = req.params;
    const referrals = await prisma.client.findMany({
      where: { referred_by_id: clientId, userId: req.user.userId },
      select: { id: true, name: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(referrals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro" });
  }
});

// ===== ANAMNESIS =====

// Busca status da anamnese do cliente (público/sem auth, usado pelo link do cliente)
app.get('/api/anamnesis/:clientId', async (req: any, res: any) => {
  try {
    const { clientId } = req.params;
    
    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, name: true, userId: true }
    });
    
    if (!client) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }

    // Check if anamnesis exists
    const anamnesis = await prisma.anamnesis.findFirst({
      where: { clientId }
    });

    res.json({
      client,
      hasAnamnesis: !!anamnesis,
      anamnesis: anamnesis ? {
        id: anamnesis.id,
        answers: JSON.parse(anamnesis.answers),
        discoverySource: anamnesis.discoverySource
      } : null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar ficha" });
  }
});

// Salva nova ficha (público/sem auth)
app.post('/api/anamnesis/:clientId', async (req: any, res: any) => {
  try {
    const { clientId } = req.params;
    const { formData, age } = req.body;

    // Atualiza a idade do cliente
    if (age) {
      await prisma.client.update({
        where: { id: clientId },
        data: { age: Number(age) }
      });
    }

    // Cria a ficha
    const anamnesis = await prisma.anamnesis.create({
      data: {
        clientId,
        discoverySource: formData.discovery_source,
        answers: JSON.stringify(formData)
      }
    });

    res.json(anamnesis);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao salvar ficha" });
  }
});

// ===== ADMIN ROUTES =====

// Check if user is MASTER/SUPERADMIN
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'MASTER' && req.user.role !== 'SUPERADMIN') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  next();
};

app.post('/api/admin/codes', authenticate, requireAdmin, async (req: any, res: any) => {
  try {
    const { code, student_name, phone, email, payment_method, value } = req.body;
    const newCode = await prisma.accessCode.create({
      data: {
        code,
        clientName: student_name,
        clientPhone: phone,
        clientEmail: email,
        paymentMethod: payment_method,
        subscriptionValue: Number(value),
        status: 'available'
      }
    });
    res.json(newCode);
  } catch (error) {
    console.error("Error creating code:", error);
    res.status(500).json({ error: "Erro ao criar código" });
  }
});

app.get('/api/admin/codes', authenticate, requireAdmin, async (req: any, res: any) => {
  try {
    const codes = await prisma.accessCode.findMany({
      orderBy: { createdAt: 'desc' }
    });
    // Formatar igual ao q o frontend espera
    const formatted = codes.map((c: any) => ({
      id: c.id,
      code: c.code,
      student_name: c.clientName,
      phone: c.clientPhone,
      email: c.clientEmail,
      payment_method: c.paymentMethod,
      value: c.subscriptionValue,
      status: c.status,
      created_at: c.createdAt
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar códigos" });
  }
});

app.get('/api/admin/subscriptions', authenticate, requireAdmin, async (req: any, res: any) => {
  try {
    const subs = await prisma.subscription.findMany({
      orderBy: { expiresAt: 'asc' }
    });
    const formatted = subs.map((s: any) => ({
      id: s.id,
      user_id: s.userId,
      expires_at: s.expiresAt,
      created_at: s.createdAt,
      status: new Date(s.expiresAt) > new Date() ? 'active' : 'expired'
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar assinaturas" });
  }
});

app.put('/api/admin/subscriptions/:id/renew', authenticate, requireAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { expiresAt } = req.body;
    const updated = await prisma.subscription.update({
      where: { id },
      data: { expiresAt: new Date(expiresAt) }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Erro ao renovar" });
  }
});

// ===== SUPPORT ROUTES =====
app.get('/api/support', authenticate, async (req: any, res: any) => {
  try {
    const messages = await prisma.supportMessage.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'asc' }
    });
    // Formatar igual ao front espera
    const formatted = messages.map((m: any) => ({
      id: m.id,
      message: m.message,
      is_from_support: m.is_from_support,
      created_at: m.createdAt,
      user_id: m.userId
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: "Erro" });
  }
});

app.post('/api/support', authenticate, async (req: any, res: any) => {
  try {
    const { message } = req.body;
    const msg = await prisma.supportMessage.create({
      data: {
        message,
        userId: req.user.userId,
        is_from_support: false
      }
    });
    res.json({
      id: msg.id,
      message: msg.message,
      is_from_support: msg.is_from_support,
      created_at: msg.createdAt,
      user_id: msg.userId
    });
  } catch (error) {
    res.status(500).json({ error: "Erro" });
  }
});

// Admin Support Routes
app.get('/api/admin/support', authenticate, requireAdmin, async (req: any, res: any) => {
  try {
    // Get all users who have sent support messages
    const usersWithMessages = await prisma.user.findMany({
      where: { supportMessages: { some: {} } },
      include: {
        supportMessages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    res.json(usersWithMessages);
  } catch (error) {
    res.status(500).json({ error: "Erro" });
  }
});

app.get('/api/admin/support/:userId', authenticate, requireAdmin, async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const messages = await prisma.supportMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });
    const formatted = messages.map((m: any) => ({
      id: m.id,
      message: m.message,
      is_from_support: m.is_from_support,
      created_at: m.createdAt,
      user_id: m.userId
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: "Erro" });
  }
});

app.post('/api/admin/support/:userId', authenticate, requireAdmin, async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const { message } = req.body;
    const msg = await prisma.supportMessage.create({
      data: {
        message,
        userId,
        is_from_support: true
      }
    });
    res.json({
      id: msg.id,
      message: msg.message,
      is_from_support: msg.is_from_support,
      created_at: msg.createdAt,
      user_id: msg.userId
    });
  } catch (error) {
    res.status(500).json({ error: "Erro" });
  }
});

// ===== ADMIN USERS ROUTES =====
app.get('/api/admin/users', authenticate, requireAdmin, async (req: any, res: any) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        accessCodesUsed: true,
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    // Format to match frontend
    const formatted = users.map((u: any) => {
      const accessCode = u.accessCodesUsed && u.accessCodesUsed.length > 0 ? u.accessCodesUsed[0] : null;
      const sub = u.subscriptions && u.subscriptions.length > 0 ? u.subscriptions[0] : null;
      
      return {
        id: u.id,
        nome: u.name,
        email: u.email,
        whatsapp: u.whatsapp,
        role: u.role,
        is_active: u.isActive,
        created_at: u.createdAt,
        access_code: accessCode ? accessCode.code : null,
        subscription_value: accessCode && accessCode.subscriptionValue ? accessCode.subscriptionValue : 97,
        expires_at: sub ? sub.expiresAt : null
      };
    });
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: "Erro" });
  }
});

app.put('/api/admin/users/:id/toggle', authenticate, requireAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: is_active }
    });
    
    res.json({
      id: updated.id,
      nome: updated.name,
      email: updated.email,
      role: updated.role,
      is_active: updated.isActive,
      created_at: updated.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: "Erro" });
  }
});

// ===== ADMIN STATS ROUTE =====
app.get('/api/admin/stats', authenticate, requireAdmin, async (req: any, res: any) => {
  try {
    const activeUsers = await prisma.user.findMany({ 
      where: { role: 'USER', isActive: true },
      include: { accessCodesUsed: true }
    });
    
    const totalUsers = activeUsers.length;
    
    // MRR is the sum of all active users' subscription values
    let totalRevenue = 0;
    activeUsers.forEach((u: any) => {
      const accessCode = u.accessCodesUsed && u.accessCodesUsed.length > 0 ? u.accessCodesUsed[0] : null;
      if (accessCode && accessCode.subscriptionValue) {
        totalRevenue += accessCode.subscriptionValue;
      } else {
        totalRevenue += 97; // fallback default
      }
    });

    const ticketMedio = totalUsers > 0 ? Math.round(totalRevenue / totalUsers) : 0;
    
    res.json({
      totalStudents: totalUsers,
      monthlyGrowth: "+0%",
      totalRevenue: totalRevenue,
      churnRate: "0%",
      ticketMedio: ticketMedio,
      ltv: ticketMedio * 12, // estimate 12 months
      cac: 0,
      arr: totalRevenue * 12
    });
  } catch (error) {
    res.status(500).json({ error: "Erro" });
  }
});

// Mais rotas virão aqui...

app.listen(PORT, () => {
  console.log(`🔥 Backend rodando na porta ${PORT}`);
});
