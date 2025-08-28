import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

// Define the structure of a Pagamento object
interface Pagamento {
  id_pagamento: string;
  data_prevista: string;
  // ... other fields
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ano = searchParams.get('ano');
    const mes = searchParams.get('mes');

    // Construct the path to the mock data file
    const filePath = path.join(process.cwd(), 'src', 'lib', 'mocks', 'pagamentos.json');

    // Read the file content
    const fileContent = await fs.readFile(filePath, 'utf-8');

    // Parse the JSON data
    let pagamentos: Pagamento[] = JSON.parse(fileContent);

    // Filter the data based on the query parameters (if they exist)
    if (ano && mes) {
      const mesParam = parseInt(mes, 10);
      pagamentos = pagamentos.filter(p => {
        const data = new Date(p.data_prevista);
        return data.getFullYear() === parseInt(ano, 10) && data.getMonth() + 1 === mesParam;
      });
    }

    return NextResponse.json(pagamentos);
  } catch (error) {
    console.error('Failed to read or parse pagamentos mock data:', error);
    // In case of an error (e.g., file not found), return a 500 status
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
