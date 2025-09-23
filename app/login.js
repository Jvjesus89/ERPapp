import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { supabase } from '@/lib/supabase'; // Precisamos do Supabase para a consulta de empresas
import { colors } from '../styles/global';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const router = useRouter();
  const { signIn, session, isBiometricSupport, loginWithBiometrics, getBiometricCredentials } = useAuth();

  useEffect(() => {
    const checkBiometrics = async () => {
      const supported = await isBiometricSupport();
      const credentials = await getBiometricCredentials();
      setIsBiometricEnabled(supported && !!credentials);
    };
    checkBiometrics();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);
    
    const { data: authData, error } = await signIn(email, password);
      
    if (error) {
      Alert.alert('Erro de Login', error.message);
      setIsLoading(false);
      return;
    }

    if (authData.user) {
        // Passo 2: Após o login, verificar a quantas empresas o utilizador pertence
        const { data: memberships, error: membershipError } = await supabase
            .from('membros_empresa')
            .select('empresa_id, empresas ( nome )')
            .eq('user_id', authData.user.id);

        if (membershipError) {
            Alert.alert('Erro', 'Não foi possível verificar as suas empresas.');
            setIsLoading(false);
            return;
        }

        // Se o utilizador não pertence a nenhuma empresa (caso raro), exibe um erro.
        if (!memberships || memberships.length === 0) {
            Alert.alert('Acesso Negado', 'Você não é membro de nenhuma empresa.');
            setIsLoading(false);
            return;
        }

        // Se pertence a apenas UMA empresa, entra diretamente.
        if (memberships.length === 1) {
            // Aqui, no futuro, vamos guardar a empresa_id selecionada num contexto global.
            // Por agora, apenas redirecionamos.
            router.replace('/(tabs)');
        } 
        // Se pertence a VÁRIAS empresas, vai para a tela de seleção.
        else {
            router.replace({
                pathname: '/select-company',
                params: { userId: authData.user.id }
            });
        }
    }
    
    setIsLoading(false);
  };

  const handleBiometricLogin = async () => {
    // A lógica de login biométrico também precisará ser ajustada no futuro
    // para seguir o mesmo fluxo de verificação de empresas.
    Alert.alert('Em Breve', 'O login biométrico será reativado após a seleção de empresa.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>ERP Login</Text>
        
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholderTextColor={colors.textLight}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            placeholderTextColor={colors.textLight}
          />
          
          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loaderText}>Entrando...</Text>
            </View>
          ) : (
            <View style={styles.buttonContainer}>
              {isBiometricEnabled && (
                <TouchableOpacity 
                  style={[styles.button, styles.biometricButton]} 
                  onPress={handleBiometricLogin}
                >
                  <Text style={styles.biometricButtonText}>🔐 Entrar com Digital</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.button, styles.loginButton]} 
                onPress={handleLogin}
              >
                <Text style={styles.loginButtonText}>Entrar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.linkContainer}
          onPress={() => router.replace('/signup')}
        >
          <Text style={styles.link}>Não tem uma conta? Cadastre-se</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 32,
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24, // Aumentado o espaço
    color: colors.text,
  },
  form: {
    marginBottom: 24,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: colors.white,
  },
  loaderContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textLight,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loginButton: {
    backgroundColor: colors.primary,
  },
  biometricButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  loginButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  linkContainer: {
    alignItems: 'center',
  },
  link: {
    color: colors.primary,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
