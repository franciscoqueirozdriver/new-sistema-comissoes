import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getSheetData, appendRows } from "@/lib/googleSheetsService";

export const dynamic = 'force-dynamic';

// 1. Definimos o objeto de opções como uma constante exportável
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      try {
        const { header, rows } = await getSheetData("Usuarios");
        const emailIndex = header.indexOf("email");
        const userExists = rows.some(row => row[emailIndex] === user.email);
        if (!userExists) {
          const newUserRow = [user.email, user.name, 'usuario', 'pendente'];
          await appendRows("Usuarios", [newUserRow]);
        }
        return true;
      } catch (error) {
        console.error("Erro no callback signIn:", error);
        return false;
      }
    },
    async session({ session, token }) {
      try {
        const { header, rows } = await getSheetData("Usuarios");
        const userRow = rows.find(row => row[header.indexOf("email")] === session.user.email);
        if (userRow) {
          session.user.role = userRow[header.indexOf("role")];
          session.user.status = userRow[header.indexOf("status")];
        } else {
          session.user.role = 'usuario';
          session.user.status = 'pendente';
        }
        return session;
      } catch (error) {
        console.error("Erro no callback session:", error);
        session.user.role = 'usuario';
        session.user.status = 'pendente';
        return session;
      }
    },
  },
  pages: {
    error: '/auth/error', 
  }
};

// 2. O export default agora usa a constante que definimos acima
export default NextAuth(authOptions);
