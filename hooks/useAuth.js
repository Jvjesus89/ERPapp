import { supabase } from '@/lib/supabase';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';

// Função para delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Busca dados extras do usuário na tabela 'usuarios'
  async function fetchProfile(userEmail) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', userEmail)
        .single();
      
      if (!error && data) {
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      setProfile(null);
    }
  }

  // Funções de autenticação biométrica
  const isBiometricSupport = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Erro ao verificar suporte biométrico:', error);
      return false;
    }
  };

  const enableBiometrics = async (email, password) => {
    try {
      // Primeiro, fazer login para verificar se a senha está correta
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        throw new Error('Senha incorreta');
      }

      // Se o login foi bem-sucedido, salvar as credenciais
      const credentials = {
        email: email,
        password: password,
      };

      await SecureStore.setItemAsync('biometric_credentials', JSON.stringify(credentials));
      
      // Fazer logout para não manter a sessão ativa
      await supabase.auth.signOut();
      
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const disableBiometrics = async () => {
    try {
      await SecureStore.deleteItemAsync('biometric_credentials');
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const getBiometricCredentials = async () => {
    try {
      const credentials = await SecureStore.getItemAsync('biometric_credentials');
      return credentials ? JSON.parse(credentials) : null;
    } catch (error) {
      console.error('Erro ao buscar credenciais biométricas:', error);
      return null;
    }
  };

  const loginWithBiometrics = async () => {
    try {
      // Verificar se há credenciais salvas
      const credentials = await getBiometricCredentials();
      if (!credentials) {
        throw new Error('Nenhuma credencial biométrica encontrada');
      }

      // Solicitar autenticação biométrica
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Use sua digital para fazer login',
        fallbackLabel: 'Usar senha',
        cancelLabel: 'Cancelar',
      });

      if (!result.success) {
        throw new Error('Autenticação biométrica falhou');
      }

      // Fazer login com as credenciais salvas
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        await delay(1000);
        await fetchProfile(data.user.email);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  useEffect(() => {
    // Verificar se há uma sessão ativa
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        fetchProfile(session.user.email);
      }
    });

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        fetchProfile(session.user.email);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data.user) {
        await delay(1000);
        await fetchProfile(data.user.email);
      }
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signUp = async (email, password, usuario) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailConfirm: false // Não enviar email de confirmação
        }
      });
      
      if (error) throw error;
      
      if (data.user) {
        await delay(2000);
        
        // Inserir apenas os campos necessários, sem idusuario
        const { error: errorInsert } = await supabase
          .from('usuarios')
          .insert({
            usuario: usuario,
            email: email,
            senha: password,
            dtcadastro: new Date().toISOString().split('T')[0]
          });
        
        if (errorInsert) {
          console.error('Erro ao inserir na tabela usuarios:', errorInsert);
        } else {
          await delay(1000);
          await fetchProfile(data.user.email);
        }
      }
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setProfile(null);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    isBiometricSupport,
    enableBiometrics,
    disableBiometrics,
    getBiometricCredentials,
    loginWithBiometrics,
  };
} 