import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "next-auth/react";

export default function GerenciarUsuariosPage() {
    const { data: session } = useSession();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Formulário para convidar novo usuário
    const [inviteForm, setInviteForm] = useState({
        email: '',
        nome: '',
        role: 'usuario'
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/usuarios');
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || "Falha ao buscar usuários.");
            }
            const data = await response.json();
            setUsers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Só busca os dados se o usuário logado for admin
        if (session?.user?.role === 'admin') {
            fetchData();
        }
    }, [session, fetchData]);

    const handleUserChange = (index, field, value) => {
        const updatedUsers = [...users];
        updatedUsers[index][field] = value;
        setUsers(updatedUsers);
    };

    const handleInvite = async () => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inviteForm)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Falha ao enviar convite.");
            
            alert("Convite enviado com sucesso!");
            setInviteForm({ email: '', nome: '', role: 'usuario' }); // Limpa o formulário
            fetchData(); // Recarrega a lista de usuários
        } catch (err) {
            alert(`Erro: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleSaveChanges = async () => {
        // Esta função agora lida com a atualização de múltiplos usuários (mudança de role/status)
        // A API precisa ser ajustada para receber a lista inteira.
        // Por enquanto, vamos fazer uma chamada para cada usuário alterado.
        // Esta parte pode ser otimizada no futuro.
        alert("Funcionalidade de salvar múltiplas alterações ainda será implementada.");
    }
    
    const handleUpdateUser = async (user) => {
        setIsSaving(true);
        try {
             const response = await fetch('/api/usuarios', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            });
             const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Falha ao atualizar usuário.");
            alert(`Usuário ${user.email} atualizado com sucesso!`);
            fetchData();
        } catch (err) {
            alert(`Erro: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    }


    if (loading) return <div className="p-6 text-center">Carregando...</div>;
    // Se o usuário não for admin, ele não pode ver esta página
    if (session?.user?.role !== 'admin') {
        return <div className="p-6 text-center text-red-500">Acesso negado. Esta página é apenas para administradores.</div>;
    }
    
    if (error) return <div className="p-6 text-center text-red-500">Erro: {error}</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Gerenciar Usuários</h1>
            
            <Card>
                <CardHeader><CardTitle>Convidar Novo Usuário</CardTitle></CardHeader>
                <CardContent className="p-4 flex flex-wrap items-end gap-4">
                    <div className="flex-grow"><label className="text-xs">Nome</label><input type="text" placeholder="Nome do usuário" className="w-full p-2 border rounded" value={inviteForm.nome} onChange={(e) => setInviteForm({...inviteForm, nome: e.target.value})} /></div>
                    <div className="flex-grow"><label className="text-xs">E-mail</label><input type="email" placeholder="email@exemplo.com" className="w-full p-2 border rounded" value={inviteForm.email} onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})} /></div>
                    <div><label className="text-xs">Função (Role)</label><select className="w-full p-2 border rounded bg-white" value={inviteForm.role} onChange={(e) => setInviteForm({...inviteForm, role: e.target.value})}><option value="usuario">Usuário</option><option value="admin">Admin</option></select></div>
                    <button onClick={handleInvite} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700" disabled={isSaving || !inviteForm.email}>Convidar</button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Usuários Cadastrados</CardTitle></CardHeader>
                <CardContent className="p-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-2">Nome</th>
                                    <th className="p-2">E-mail</th>
                                    <th className="p-2">Função (Role)</th>
                                    <th className="p-2">Status</th>
                                    <th className="p-2">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user, index) => (
                                    <tr key={user.email} className="border-b">
                                        <td className="p-2">{user.nome}</td>
                                        <td className="p-2">{user.email}</td>
                                        <td className="p-2">
                                            <select value={user.role} onChange={(e) => handleUserChange(index, 'role', e.target.value)} className="p-1 border rounded bg-white">
                                                <option value="usuario">Usuário</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                        <td className="p-2">
                                            <select value={user.status} onChange={(e) => handleUserChange(index, 'status', e.target.value)} className="p-1 border rounded bg-white">
                                                <option value="convidado">Convidado</option>
                                                <option value="pendente">Pendente</option>
                                                <option value="aprovado">Aprovado</option>
                                                <option value="bloqueado">Bloqueado</option>
                                            </select>
                                        </td>
                                        <td className="p-2">
                                            <button onClick={() => handleUpdateUser(users[index])} className="text-sm font-medium text-blue-600 hover:underline" disabled={isSaving}>Salvar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
