# Regras do Projeto Noxus (Multi sistemas)

## 1. Banco de Dados e Prisma (Isolamento Supabase)
Sempre que for criar ou alterar configurações de banco de dados neste projeto, lembre-se que ele divide o mesmo projeto do Supabase ("Multi sistemas") com outros aplicativos.
Para evitar a perda e mistura de dados:
- O banco de dados principal deve ser sempre PostgreSQL (Supabase).
- **Isolamento por Schema:** A connection string (`DATABASE_URL` e `DIRECT_URL`) deve **sempre** conter o parâmetro `?schema=noxus` no final.
- **Isolamento por Tabelas:** Todos os models no Prisma (`schema.prisma`) devem usar o prefixo `noxus_` através da instrução `@@map("noxus_nome_da_tabela")`.
- **Cuidado extremo:** Nunca use o comando `npx prisma db push --accept-data-loss` ou rode migrações destrutivas no schema `public`, pois isso pode apagar os dados dos outros aplicativos (como `users`, `transactions`, etc). O Prisma deve rodar apenas no schema isolado `noxus`.

## 2. Padrão de Resposta do Assistente
Sempre que responder ao usuário após realizar uma alteração, configuração ou criação de código, o assistente (você) **DEVE OBRIGATORIAMENTE** formatar a resposta contendo as três seções abaixo:

### Pontos Positivos
- (Liste o que ficou bom na alteração, os benefícios da mudança e o que foi resolvido)

### Pontos de Alerta
- (Liste possíveis riscos, cuidados que o usuário deve ter, ou coisas que podem quebrar no futuro por causa dessa alteração)

### Próximos Passos
- (Dê dicas do que o usuário pode testar ou implementar em seguida para continuar evoluindo o projeto)

## 3. Comunicação e Linguagem (Foco no Usuário Não-Programador)
O criador do projeto **não é um programador sênior**, ele é um empreendedor/usuário focado na regra de negócio e que usa a IDE para construir o produto. Portanto:
- **Linguagem Simples:** Evite jargões técnicos complexos (como "imutabilidade", "injeção de dependência", etc.) a menos que você os explique com uma analogia muito simples. Fale como se estivesse explicando para um parceiro de negócios.
- **Insights de Segurança e Boas Práticas:** Sempre que possível, traga alertas mastigados sobre coisas que o usuário pode não saber que são perigosas (ex: chaves expostas, regras de banco de dados, falhas de segurança comuns em SaaS).
- **Ideias de Design e Referências:** Em toda resposta onde couber, traga **pelo menos uma ideia nova de design, usabilidade (UX) ou funcionalidade**, comparando com grandes aplicativos do mercado (ex: "Para melhorar isso, podemos fazer igual ao Uber que faz X...", "No Airbnb, eles usam um botão Y que fica mais fácil..."). Ajude a elevar o nível do produto.
