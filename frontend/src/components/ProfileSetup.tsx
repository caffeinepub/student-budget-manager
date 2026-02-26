import { useState } from 'react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User } from 'lucide-react';

export default function ProfileSetup() {
  const [name, setName] = useState('');
  const { mutateAsync: saveProfile, isPending } = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    try {
      await saveProfile({ displayName: name.trim() });
      toast.success('Profile created! Welcome aboard 🎉');
    } catch {
      toast.error('Failed to save profile. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <User size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Welcome!</h2>
          <p className="text-muted-foreground text-sm mt-1">What should we call you?</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Your Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya, Rahul..."
              className="h-12 rounded-xl text-base"
              autoFocus
            />
          </div>
          <Button
            type="submit"
            disabled={isPending || !name.trim()}
            className="w-full h-12 rounded-xl font-bold text-base"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              'Continue →'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
