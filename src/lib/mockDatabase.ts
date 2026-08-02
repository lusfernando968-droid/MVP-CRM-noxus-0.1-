export class MockDatabase {
  private getTable(table: string) {
    const data = localStorage.getItem(`mock_db_${table}`);
    return data ? JSON.parse(data) : [];
  }

  private setTable(table: string, data: any[]) {
    localStorage.setItem(`mock_db_${table}`, JSON.stringify(data));
  }

  from(table: string) {
    let queryResult: any = [...this.getTable(table)];
    let currentOperation: 'select' | 'insert' | 'update' | 'delete' | null = null;
    let updateData: any = null;
    let insertData: any = null;
    let filters: Array<(row: any) => boolean> = [];
    let order: { column: string; ascending: boolean } | null = null;
    let isSingle = false;
    let selectOptions: any = null;

    const execute = async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      let tableData = this.getTable(table);

      if (currentOperation === 'insert') {
        const newData = Array.isArray(insertData) ? insertData : [insertData];
        const inserted = newData.map(item => ({
          ...item,
          id: item.id || (Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)),
          created_at: new Date().toISOString()
        }));
        tableData = [...tableData, ...inserted];
        this.setTable(table, tableData);
        return { data: isSingle ? inserted[0] : inserted, error: null };
      }

      if (currentOperation === 'delete') {
        const beforeCount = tableData.length;
        tableData = tableData.filter(row => !filters.every(f => f(row)));
        this.setTable(table, tableData);
        return { data: null, error: null };
      }

      if (currentOperation === 'update') {
        const updated: any[] = [];
        tableData = tableData.map(row => {
          if (filters.every(f => f(row))) {
            const newRow = { ...row, ...updateData };
            updated.push(newRow);
            return newRow;
          }
          return row;
        });
        this.setTable(table, tableData);
        return { data: isSingle ? updated[0] : updated, error: null };
      }

      if (currentOperation === 'select') {
        let result = tableData.filter(row => filters.every(f => f(row)));
        
        if (order) {
          result.sort((a, b) => {
            const valA = a[order!.column];
            const valB = b[order!.column];
            if (valA < valB) return order!.ascending ? -1 : 1;
            if (valA > valB) return order!.ascending ? 1 : -1;
            return 0;
          });
        }
        
        let returnCount = null;
        if (selectOptions && selectOptions.count === 'exact') {
            returnCount = result.length;
        }

        if (selectOptions && selectOptions.head) {
           return { data: null, count: returnCount, error: null };
        }

        if (isSingle) {
          return { data: result.length > 0 ? result[0] : null, count: returnCount, error: null };
        }
        return { data: result, count: returnCount, error: null };
      }

      return { data: null, error: new Error("No operation specified") };
    };

    const chain = {
      select: (columns?: string, options?: any) => {
        if (!currentOperation) currentOperation = 'select';
        selectOptions = options;
        return chain;
      },
      insert: (data: any) => {
        currentOperation = 'insert';
        insertData = data;
        return chain;
      },
      update: (data: any) => {
        currentOperation = 'update';
        updateData = data;
        return chain;
      },
      delete: () => {
        currentOperation = 'delete';
        return chain;
      },
      eq: (column: string, value: any) => {
        filters.push((row: any) => row[column] === value);
        return chain;
      },
      gte: (column: string, value: any) => {
        filters.push((row: any) => row[column] >= value);
        return chain;
      },
      lte: (column: string, value: any) => {
        filters.push((row: any) => row[column] <= value);
        return chain;
      },
      in: (column: string, values: any[]) => {
        filters.push((row: any) => values.includes(row[column]));
        return chain;
      },
      order: (column: string, options?: { ascending?: boolean }) => {
        order = { column, ascending: options?.ascending ?? true };
        return chain;
      },
      single: () => {
        isSingle = true;
        return chain;
      },
      maybeSingle: () => {
        isSingle = true;
        return chain;
      },
      then: (resolve: any, reject: any) => {
        execute().then(resolve).catch(reject);
      }
    };

    return chain;
  }
}
