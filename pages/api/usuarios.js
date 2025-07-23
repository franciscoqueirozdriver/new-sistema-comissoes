import { getSheetData, updateSheet, appendRows } from "@/lib/googleSheetsService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { sendInvitationEmail } from "@/lib/emailService";

export const dynamic = 'force-dynamic';

const ABA_USUARIOS = "Usuarios";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user || session.user.role !== 'admin') {
    return res.status(403).json({ error: "Acesso negado. Apenas administradores." });
  }

  try {
    switch (req.method) {
      // LISTAR todos os usuários
      case "GET": {
        const { header, rows } = await getSheetData(ABA_USUARIOS);
        const usuarios = rows.map(row => {
            const userObj = {};
            header.forEach((key, i) => { userObj[key] = row[i] || ""; });
            return userObj;
        });
        return res.status(200).json(usuarios);
      }

      // ATUALIZAR um usuário (role ou status)
      case "PUT": {
        const { email, role, status } = req.body;
        if (!email || (!role && !status)) {
          return res.status(400).json({ error: "Informações insuficientes para atualizar." });
        }

        const { header, rows } = await getSheetData(ABA_USUARIOS);
        const emailIndex = header.indexOf("email");
        let userFound = false;

        const updatedRows = rows.map(row => {
          if (row[emailIndex] === email) {
            userFound = true;
            const roleIndex = header.indexOf("role");
            const statusIndex = header.indexOf("status");
            if (role) row[roleIndex] = role;
            if (status) row[statusIndex] = status;
          }
          return row;
        });

        if (!userFound) {
          return res.status(404).json({ error: "Usuário não encontrado." });
        }

        await updateSheet(ABA_USUARIOS, [header, ...updatedRows]);
        return res.status(200).json({ success: true, message: `Usuário ${email} atualizado.` });
      }

      // CONVIDAR (criar) um novo usuário
      case "POST": {
        const { email, nome, role } = req.body;
        if (!email || !nome || !role) {
          return res.status(400).json({ error: "E-mail, nome e role são obrigatórios para o convite." });
        }

        const { header, rows } = await getSheetData(ABA_USUARIOS);
        const emailIndex = header.indexOf("email");
        const userExists = rows.some(row => row[emailIndex] === email);

        if (userExists) {
          return res.status(409).json({ error: "Este e-mail já está cadastrado." });
        }

        // Adiciona o novo usuário com status 'convidado'
        const newUserRow = [email, nome, role, 'convidado'];
        await appendRows(ABA_USUARIOS, [newUserRow]);
        

        try {
          await sendInvitationEmail({ to: email, name: nome });
        } catch (err) {
          console.error('Erro ao enviar e-mail de convite:', err);
        }
        
        
        return res.status(201).json({ success: true, message: `Convite enviado para ${email}.` });
      }

      default:
        res.setHeader("Allow", ["GET", "PUT", "POST"]);
        return res.status(405).end(`Método ${req.method} não permitido.`);
    }
  } catch (error) {
    console.error("Erro na API /api/usuarios:", error);
    res.status(500).json({ error: "Erro ao processar a requisição de usuários." });
  }
}
