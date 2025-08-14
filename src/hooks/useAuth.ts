import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'


interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  updateProfile: (updates: any) => Promise<{ success: boolean; error?: string }>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Helper function to translate Supabase error messages to user-friendly Portuguese
const translateAuthError = (error: string): string => {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.',
    'Email not confirmed': 'Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.',
    'Too many requests': 'Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.',
    'User already registered': 'Este email já está cadastrado. Faça login ou use outro email.',
    'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
    'Unable to validate email address: invalid format': 'Formato de email inválido. Verifique o endereço digitado.',
    'Signup is disabled': 'Cadastro temporariamente desabilitado. Tente novamente mais tarde.',
    'Email rate limit exceeded': 'Limite de emails excedido. Aguarde antes de solicitar outro email.',
    'Invalid email': 'Email inválido. Verifique o endereço digitado.',
    'Weak password': 'Senha muito fraca. Use uma senha mais forte com pelo menos 6 caracteres.'
  }

  // Check for exact matches first
  if (errorMap[error]) {
    return errorMap[error]
  }

  // Check for partial matches
  for (const [key, value] of Object.entries(errorMap)) {
    if (error.toLowerCase().includes(key.toLowerCase())) {
      return value
    }
  }

  // Default fallback
  return 'Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.'
}

export const useAuthProvider = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) {
        return { success: false, error: translateAuthError(error.message) }
      }

      return { success: true }
    } catch (error) {
      console.error('Sign in error:', error)
      return { success: false, error: 'Erro de conexão. Verifique sua internet e tente novamente.' }
    }
  }

  const signUp = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: name.trim(),
          }
        }
      })

      if (error) {
        return { success: false, error: translateAuthError(error.message) }
      }

      // Create user profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            full_name: name.trim(),
          })

        if (profileError) {
          console.error('Error creating user profile:', profileError)
          // Don't fail the signup if profile creation fails
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Sign up error:', error)
      return { success: false, error: 'Erro de conexão. Verifique sua internet e tente novamente.' }
    }
  }

  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // URL de redirecionamento para a página de reset de senha
    const redirectUrl = `${window.location.origin}/#/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: redirectUrl
    });

    if (error) {
      console.error('Erro ao enviar email de redefinição:', error.message);
      return { success: false, error: translateAuthError(error.message) };
    }

    return { success: true };
  } catch (error) {
    console.error('Erro inesperado no resetPassword:', error);
    return { success: false, error: 'Erro de conexão. Verifique sua internet e tente novamente.' };
  }
};

  const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, error: translateAuthError(error.message) };
      }

      return { success: true };
    } catch (error) {
      console.error('Update password error:', error);
      return { success: false, error: 'Erro de conexão. Verifique sua internet e tente novamente.' };
    }
  };


  const updateProfile = async (updates: any): Promise<{ success: boolean; error?: string }> => {
    try {
      const updateData: any = {}
      
      if (updates.email) {
        updateData.email = updates.email
      }
      if (updates.password) {
        updateData.password = updates.password
      }
      
      // Always update user_metadata with the provided data
      updateData.data = {
        ...user?.user_metadata,
        ...updates
      }
      
      const { data, error } = await supabase.auth.updateUser(updateData)

      if (error) {
        return { success: false, error: translateAuthError(error.message) }
      }

      // Force refresh the user state to get updated data
      const { data: { user: refreshedUser } } = await supabase.auth.getUser()
      if (refreshedUser) {
        setUser(refreshedUser)
      }

      return { success: true }
    } catch (error) {
      console.error('Update profile error:', error)
      return { success: false, error: 'Erro de conexão. Verifique sua internet e tente novamente.' }
    }
  }

  const isAuthenticated = !!user

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    isAuthenticated
  }
}

export { AuthContext }