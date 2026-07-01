import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, LogIn } from 'lucide-react';
import logoDark from '@/assets/kora-branca.png.asset.json';

export default function Comecar() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="p-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <img src={logoDark.url} alt="KORA" className="h-7 w-auto" />
        <div className="w-16" />
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-3xl animate-fade-in">
          <div className="text-center mb-14">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Bem-vindo à KORA</h1>
            <p className="mt-4 text-white/60">Como você quer continuar?</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <button
              onClick={() => navigate('/cadastro')}
              className="group text-left rounded-3xl border border-white/10 bg-white/[0.02] p-8 hover:bg-white/[0.05] hover:border-white/20 transition-all duration-300"
            >
              <div className="h-12 w-12 rounded-2xl bg-white text-black flex items-center justify-center mb-6">
                <UserPlus className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Criar Conta</h2>
              <p className="text-sm text-white/60 leading-relaxed">Novo por aqui? Crie sua conta gratuitamente e escolha um plano em seguida.</p>
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="group text-left rounded-3xl border border-white/10 bg-white/[0.02] p-8 hover:bg-white/[0.05] hover:border-white/20 transition-all duration-300"
            >
              <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-6">
                <LogIn className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Já tenho uma conta</h2>
              <p className="text-sm text-white/60 leading-relaxed">Faça login com seu e-mail e senha para acessar a plataforma.</p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}