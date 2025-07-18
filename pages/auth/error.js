// /pages/auth/error.js

import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { signIn } from 'next-auth/react';

export default function AuthErrorPage() {
  const router = useRouter();
  const { error } = router.query;

  // Define mensagens amigáveis para diferentes tipos de erro
  const errorMessages = {
    OAuthCallback: "Ocorreu um erro durante a autenticação com o Google. Por favor, tente novamente.",
    default: "Ocorreu um erro. Por favor, tente fazer o login novamente."
  };

  // Mensagem para usuários aguardando aprovação
  const AcessoPendente = () => (
    <>
      <p className="mb-4 text-gray-600">Sua conta foi criada com sucesso e está aguardando a aprovação de um administrador.</p>
      <p className="text-sm text-gray-500">Você será notificado quando seu acesso for liberado.</p>
    </>
  );
  
  // Se não houver um erro específico, assumimos que é um novo usuário aguardando aprovação
  const isPendingApproval = !error;

  return (
    <div className="flex items-center justify-center min-h-full p-4 bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {isPendingApproval ? "Acesso Pendente" : "Erro de Autenticação"}
          </-CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {isPendingApproval 
            ? <AcessoPendente /> 
            : <p>{errorMessages[error] || errorMessages.default}</p>
          }
          <button
            onClick={() => signIn('google')}
            className="mt-6 w-full bg-violet-600 text-white px-4 py-2 rounded hover:bg-violet-700"
          >
            Tentar Novamente
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
