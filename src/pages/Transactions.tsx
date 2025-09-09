import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Transaction {
    id: string;
    type: string;
    amount: number;
    status: string;
    description: string;
    created_at: string;
}

export default function Transactions() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [page, setPage] = useState(1);
    const [pageSize] = useState(6);
    const [totalCount, setTotalCount] = useState(0);

    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

    const totalPages = Math.ceil(totalCount / pageSize);

    useEffect(() => {
        if (!user) {
            navigate("/auth");
            return;
        }
        fetchTransactions(page, pageSize);
    }, [user, navigate, page]);


    const fetchTransactions = async (page: number, pageSize: number) => {
        try {
            const start = (page - 1) * pageSize;
            const end = start + pageSize - 1;

            const { data: transactionsData, count } = await supabase
                .from("transactions")
                .select("*", { count: 'exact' })
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .range(start, end);

            setRecentTransactions(transactionsData || []);
            setTotalCount(count || 0);
        }
        catch (error) {
            console.error("Error fetching transactions:", error);
            toast.error("Erro ao buscar transações.");
        }
    }

    const getTransactionColor = (type: string, status: string) => {
        if (status === "pending") return "bg-yellow-100 text-yellow-800";
        if (status === "rejected") return "bg-red-100 text-red-800";

        switch (type) {
            case "deposit": return "bg-green-100 text-green-800";
            case "withdrawal": return "bg-blue-100 text-blue-800";
            case "bet": return "bg-purple-100 text-purple-800";
            case "prize": return "bg-orange-100 text-orange-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getTransactionText = (type: string) => {
        switch (type) {
            case "deposit": return "Depósito";
            case "withdrawal": return "Saque";
            case "bet": return "Aposta";
            case "prize": return "Prêmio";
            default: return type;
        }
    };

    return (
        <div className="min-h-screen">
            <Header isAuthenticated={!!user} />
            <div className="container mx-auto p-4">
                <Button
                    variant="ghost"
                    onClick={() => navigate("/dashboard")}
                    className="mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                </Button>

                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-foreground">Minhas Transações</h1>
                    <p className="text-muted-foreground">Histórico de todas as suas transações</p>
                </div>
                <Card>
                    <CardHeader>
                        <div className="flex">
                            <CardTitle>Transações Recentes</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="min-h-[550px]">
                        {recentTransactions.length === 0 ? (
                            <p className="text-muted-foreground">Nenhuma transação ainda</p>
                        ) : (
                            <div className="space-y-2">
                                {recentTransactions.map((transaction) => (
                                    <div key={transaction.id} className="flex justify-between items-center w-full">
                                        <Card className="w-full">
                                            <CardContent className="flex items-center justify-between py-4">
                                                {/* Centraliza verticalmente e cria espaçamento entre os elementos */}
                                                <div className="flex flex-col items-start justify-center">
                                                    <Badge className={getTransactionColor(transaction.type, transaction.status)}>
                                                        {getTransactionText(transaction.type)}
                                                    </Badge>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`font-medium ${transaction.type === 'withdrawal' || transaction.type === 'bet' ? 'text-red-600' : 'text-green-600'}`}
                                                >
                                                    {transaction.type === 'withdrawal' || transaction.type === 'bet' ? '-' : '+'}
                                                    R$ {transaction.amount.toFixed(2)}
                                                </span>
                                            </CardContent>
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
                <div className="flex justify-between mt-4">
                    <Button
                        onClick={() => setPage((prev) => prev - 1)}
                        disabled={page === 1}
                    >
                        Anterior
                    </Button>

                    <span>Página {page} de {totalPages}</span>

                    <Button
                        onClick={() => setPage((prev) => prev + 1)}
                        disabled={page === totalPages}
                    >
                        Próxima
                    </Button>
                </div>
            </div>
        </div>
    );
}
