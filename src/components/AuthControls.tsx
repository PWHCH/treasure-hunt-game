import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Input } from './ui/input';

interface AuthFormValues {
  username: string;
  password: string;
}

interface AuthUser {
  id: number;
  username: string;
}

interface AuthControlsProps {
  user: AuthUser | null;
  onSignup: (username: string, password: string) => Promise<void>;
  onLogin: (username: string, password: string) => Promise<void>;
  onLogout: () => void;
}

function AuthDialog({
  mode,
  onSubmit,
}: {
  mode: 'signup' | 'login';
  onSubmit: (username: string, password: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<AuthFormValues>({ defaultValues: { username: '', password: '' } });

  const title = mode === 'signup' ? 'Sign Up' : 'Log In';

  const handleSubmit = async (values: AuthFormValues) => {
    setServerError(null);
    try {
      await onSubmit(values.username, values.password);
      form.reset();
      setOpen(false);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          form.reset();
          setServerError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">{title}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {serverError && <p className="text-destructive text-sm">{serverError}</p>}
            <FormField
              control={form.control}
              name="username"
              rules={{
                required: 'Username is required',
                minLength: { value: 3, message: 'Username must be at least 3 characters' },
                maxLength: { value: 20, message: 'Username must be at most 20 characters' },
                pattern: {
                  value: /^[a-zA-Z0-9_]+$/,
                  message: 'Only letters, numbers, and underscores allowed',
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input autoComplete="username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              rules={{
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {title}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function AuthControls({ user, onSignup, onLogin, onLogout }: AuthControlsProps) {
  if (user) {
    return (
      <div className="flex items-center gap-3 text-amber-800">
        <span>
          Signed in as <span className="text-amber-900">{user.username}</span>
        </span>
        <Button variant="ghost" onClick={onLogout}>
          Log Out
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <AuthDialog mode="signup" onSubmit={onSignup} />
      <AuthDialog mode="login" onSubmit={onLogin} />
    </div>
  );
}
