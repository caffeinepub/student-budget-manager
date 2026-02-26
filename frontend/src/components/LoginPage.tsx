import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Shield, TrendingUp, Target, PiggyBank } from 'lucide-react';

export default function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero */}
      <div className="gradient-primary flex flex-col items-center justify-center pt-16 pb-12 px-6 text-white">
        <img
          src="/assets/generated/logo.dim_256x256.png"
          alt="Student Budget Manager"
          className="w-20 h-20 rounded-3xl shadow-lg mb-5 object-cover"
        />
        <h1 className="text-3xl font-bold tracking-tight mb-2">Budget Manager</h1>
        <p className="text-white/80 text-center text-sm leading-relaxed">
          Smart money management for students
        </p>
      </div>

      {/* Features */}
      <div className="flex-1 px-6 py-8 space-y-4">
        {[
          { icon: PiggyBank, title: 'Track Your Income', desc: 'Pocket money, stipend & part-time earnings' },
          { icon: Target, title: 'Savings Goals', desc: 'Lock savings until you reach your target' },
          { icon: TrendingUp, title: 'Smart Investments', desc: 'Low-risk options perfect for students' },
          { icon: Shield, title: 'Digital Locker', desc: 'Keep savings safe from impulse spending' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon size={20} className="text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Login Button */}
      <div className="px-6 pb-10">
        <Button
          onClick={login}
          disabled={isLoggingIn}
          className="w-full h-14 text-base font-bold rounded-2xl gradient-primary border-0 text-white shadow-lg"
        >
          {isLoggingIn ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Logging in...
            </span>
          ) : (
            'Get Started — Login'
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-3">
          Secure login powered by Internet Identity
        </p>
      </div>
    </div>
  );
}
