// reset-password.tsx
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

export default function ResetPassword() {
  const [password, setPassword] = useState('')

  const updatePassword = async () => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      alert('Erro: ' + error.message)
    } else {
      alert('Senha alterada com sucesso!')
      window.location.href = '/login'
    }
  }

  return (
    <div>
      <h1>Redefinir Senha</h1>
      <input
        type="password"
        placeholder="Nova senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={updatePassword}>Salvar</button>
    </div>
  )
}
