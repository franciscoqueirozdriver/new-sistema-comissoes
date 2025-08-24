import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { getSheetData, appendRows, updateSheet } from "@/lib/googleSheetsService";

export const dynamic = 'force-dynamic';

const SHEET_NAME = "Permissoes";
const HEADERS = ["tipo", "rota", "visualizar", "editar", "excluir", "exportar"] as const;

export type Papel = "admin" | "usuario" | "usuarioplus";
export type LinhaPermissao = {
  tipo: Papel;
  rota: string;
  visualizar: boolean;
  editar: boolean;
  excluir: boolean;
  exportar: boolean;
};

const parseBool = (val: any): boolean => {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") return val.toLowerCase() === "true";
  return false;
};

const boolToSheet = (b: boolean): string => (b ? "TRUE" : "FALSE");

const validateItem = (item: LinhaPermissao): boolean => {
  const tipos: Papel[] = ["admin", "usuario", "usuarioplus"];
  return (
    tipos.includes(item.tipo) &&
    typeof item.rota === "string" &&
    item.rota.startsWith("/")
  );
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user?.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (req.method === "GET") {
    try {
      const { header, rows } = await getSheetData(SHEET_NAME);
      if (header.join() !== HEADERS.join()) {
        return res.status(500).json({ message: "Cabeçalho inválido" });
      }
      const items: LinhaPermissao[] = rows.map((row) => ({
        tipo: row[0] as Papel,
        rota: row[1],
        visualizar: parseBool(row[2]),
        editar: parseBool(row[3]),
        excluir: parseBool(row[4]),
        exportar: parseBool(row[5]),
      }));
      return res.status(200).json({ items });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  if (req.method === "PUT") {
    const body = req.body as { items?: LinhaPermissao[] };
    if (!body.items || !Array.isArray(body.items)) {
      return res.status(400).json({ message: "items inválido" });
    }
    try {
      const { header, rows } = await getSheetData(SHEET_NAME);
      if (header.join() !== HEADERS.join()) {
        return res.status(500).json({ message: "Cabeçalho inválido" });
      }
      const indexMap = new Map<string, number>();
      rows.forEach((row, idx) => {
        indexMap.set(`${row[0]}|${row[1]}`, idx);
      });
      for (const item of body.items) {
        if (!validateItem(item)) {
          return res.status(400).json({ message: "Item inválido" });
        }
        const key = `${item.tipo}|${item.rota}`;
        const newRow = [
          item.tipo,
          item.rota,
          boolToSheet(item.visualizar),
          boolToSheet(item.editar),
          boolToSheet(item.excluir),
          boolToSheet(item.exportar),
        ];
        if (indexMap.has(key)) {
          rows[indexMap.get(key)!] = newRow;
        } else {
          rows.push(newRow);
        }
      }
      await updateSheet(SHEET_NAME, [HEADERS, ...rows]);
      return res.status(200).json({ ok: true });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  if (req.method === "POST") {
    const body = req.body as { item?: LinhaPermissao };
    if (!body.item || !validateItem(body.item)) {
      return res.status(400).json({ message: "item inválido" });
    }
    const row = [
      body.item.tipo,
      body.item.rota,
      boolToSheet(body.item.visualizar),
      boolToSheet(body.item.editar),
      boolToSheet(body.item.excluir),
      boolToSheet(body.item.exportar),
    ];
    try {
      await appendRows(SHEET_NAME, [row]);
      return res.status(200).json({ ok: true });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  if (req.method === "DELETE") {
    const { tipo, rota } = req.query;
    if (typeof tipo !== "string" || typeof rota !== "string") {
      return res.status(400).json({ message: "Parâmetros inválidos" });
    }
    try {
      const { header, rows } = await getSheetData(SHEET_NAME);
      if (header.join() !== HEADERS.join()) {
        return res.status(500).json({ message: "Cabeçalho inválido" });
      }
      const filtered = rows.filter((row) => !(row[0] === tipo && row[1] === rota));
      await updateSheet(SHEET_NAME, [HEADERS, ...filtered]);
      return res.status(200).json({ ok: true });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  return res.status(405).end();
}
