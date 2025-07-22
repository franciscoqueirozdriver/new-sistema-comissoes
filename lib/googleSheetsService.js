import { google } from "googleapis";

// 1. Instância única de autenticação, lendo as credenciais do ambiente
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    // Garante que a chave privada, muitas vezes armazenada em uma única linha, seja formatada corretamente
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
  // Escopo geral que permite leitura e escrita, para ser usado por toda a aplicação
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// 2. Instância única do cliente da API e ID da planilha
const sheets = google.sheets({ version: "v4", auth });
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

/**
 * Função genérica para ler os dados de qualquer aba.
 * Ela lê a aba inteira, sem limites fixos, e já separa o cabeçalho das linhas.
 * @param {string} sheetName - O nome da aba (ex: "Pagamentos").
 * @returns {Promise<{header: string[], rows: any[][]}>} - Um objeto com o cabeçalho e as linhas de dados.
 */
export async function getSheetData(sheetName) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetName, // Usar apenas o nome da aba lê todas as células preenchidas

    valueRenderOption: 'FORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',    
    
  });

  const allRows = response.data.values || [];

  if (allRows.length === 0) {
    // Retorna uma estrutura vazia se a planilha não tiver dados para evitar erros
    return { header: [], rows: [] };
  }

  // --- ALTERAÇÃO APLICADA AQUI ---
  // Padroniza o cabeçalho para minúsculas e substitui espaços por underscores
  // Ex: "Fase do Funil" vira "fase_do_funil"
  const header = allRows[0].map(h => 
    String(h || "").toLowerCase().trim().replace(/ /g, '_')
  );
  const rows = allRows.slice(1);

  return { header, rows };
}

/**
 * Função genérica para adicionar novas linhas a uma aba.
 * @param {string} sheetName - O nome da aba.
 * @param {any[][]} dataRows - Um array de linhas a serem adicionadas (cada linha é um array).
 */
export async function appendRows(sheetName, dataRows) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: dataRows,
    },
  });
}

/**
 * Função genérica para limpar e reescrever uma aba inteira.
 * Ideal para operações de exclusão ou atualização em massa.
 * @param {string} sheetName - O nome da aba.
 * @param {any[][]} data - Todos os dados a serem escritos (incluindo cabeçalho).
 */
export async function updateSheet(sheetName, data) {
    const rangeToClear = `${sheetName}!A:Z`; // Limpa da coluna A até a Z

    // 1. Limpa a planilha para evitar dados "fantasmas"
    await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: rangeToClear,
    });
    
    // 2. Escreve os novos dados, se houver algum
    if (data && data.length > 0) {
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${sheetName}!A1`,
            valueInputOption: "USER_ENTERED",
            requestBody: { values: data },
        });
    }
}
