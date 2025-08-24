import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { getSheetData, updateSheet } from "@/lib/googleSheetsService";

export const dynamic = 'force-dynamic';

const SHEET_NAME = "Permissoes";
const HEADERS = ["tipo", "rota", "visualizar", "editar", "excluir", "exportar"];

const toBool = (v) => {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v.toLowerCase() === "true";
  return false;
};

const boolToSheet = (b) => (b ? "TRUE" : "FALSE");

function normTipo(v) {
  return String(v || "").trim();
}

function normRota(v) {
  const s = String(v || "").trim().replace(/\s+/g, "");
  if (!s) return "/";
  return s.startsWith("/") ? s : `/${s}`;
}

function keyOf(t, r) {
  return `${normTipo(t)}|${normRota(r)}`;
}

function validateItem(item) {
  const tipos = ["admin", "usuario", "usuarioplus"];
  const tipo = normTipo(item.tipo);
  const rota = normRota(item.rota);
  return tipos.includes(tipo) && rota.startsWith("/");
}

async function getMap() {
  const { header, rows } = await getSheetData(SHEET_NAME);
  if (header.join() !== HEADERS.join()) {
    throw new Error("Cabeçalho inválido");
  }
  const map = new Map();
  rows.forEach((row) => {
    const tipo = normTipo(row[0]);
    const rota = normRota(row[1]);
    const key = keyOf(tipo, rota);
    map.set(key, [
      tipo,
      rota,
      boolToSheet(toBool(row[2])),
      boolToSheet(toBool(row[3])),
      boolToSheet(toBool(row[4])),
      boolToSheet(toBool(row[5])),
    ]);
  });
  return map;
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  const role = (session?.user?.role) || "usuario";
  if (role !== "admin") {
    return res.status(403).send("Apenas administradores");
  }

  if (req.method === "GET") {
    try {
      const map = await getMap();
      const items = Array.from(map.values()).map((row) => ({
        tipo: row[0],
        rota: row[1],
        visualizar: toBool(row[2]),
        editar: toBool(row[3]),
        excluir: toBool(row[4]),
        exportar: toBool(row[5]),
      }));
      return res.status(200).json({ items });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  if (req.method === "PUT") {
    const body = req.body || {};
    if (!body.items || !Array.isArray(body.items)) {
      return res.status(400).json({ message: "items inválido" });
    }
    try {
      const map = await getMap();
      for (const item of body.items) {
        if (!validateItem(item)) {
          return res.status(400).json({ message: "Item inválido" });
        }
        const tipo = normTipo(item.tipo);
        const rota = normRota(item.rota);
        const key = keyOf(tipo, rota);
        map.set(key, [
          tipo,
          rota,
          boolToSheet(toBool(item.visualizar)),
          boolToSheet(toBool(item.editar)),
          boolToSheet(toBool(item.excluir)),
          boolToSheet(toBool(item.exportar)),
        ]);
      }
      await updateSheet(SHEET_NAME, [HEADERS, ...Array.from(map.values())]);
      return res.status(200).json({ ok: true, updated: body.items.length });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  if (req.method === "POST") {
    const body = req.body || {};
    if (!body.item || !validateItem(body.item)) {
      return res.status(400).json({ message: "item inválido" });
    }
    try {
      const map = await getMap();
      const item = body.item;
      const tipo = normTipo(item.tipo);
      const rota = normRota(item.rota);
      const key = keyOf(tipo, rota);
      map.set(key, [
        tipo,
        rota,
        boolToSheet(toBool(item.visualizar)),
        boolToSheet(toBool(item.editar)),
        boolToSheet(toBool(item.excluir)),
        boolToSheet(toBool(item.exportar)),
      ]);
      await updateSheet(SHEET_NAME, [HEADERS, ...Array.from(map.values())]);
      return res.status(200).json({ ok: true });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  if (req.method === "DELETE") {
    const { tipo, rota } = req.query;
    if (typeof tipo !== "string" || typeof rota !== "string") {
      return res.status(400).json({ message: "Parâmetros inválidos" });
    }
    try {
      const map = await getMap();
      map.delete(keyOf(tipo, rota));
      await updateSheet(SHEET_NAME, [HEADERS, ...Array.from(map.values())]);
      return res.status(200).json({ ok: true });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  return res.status(405).end();
}

