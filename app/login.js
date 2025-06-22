import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { colors } from '../styles/global';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const router = useRouter();
  const { signIn, profile, isBiometricSupport, loginWithBiometrics, getBiometricCredentials } = useAuth();

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
    
    const { error } = await signIn(email, password);
      
    if (error) {
      Alert.alert('Erro de Login', error.message);
    } else {
      // O redirecionamento agora é tratado pelo AuthProvider
      router.replace('/(tabs)');
    }
    
    setIsLoading(false);
  };

  const handleBiometricLogin = async () => {
    setIsLoading(true);
    const { error } = await loginWithBiometrics();
    if (error) {
      Alert.alert('Falha na Autenticação', error.message);
    }
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>ERP Login</Text>
        
        {profile && (
          <Text style={styles.profileInfo}>Bem-vindo, {profile.usuario}!</Text>
        )}
        
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
    marginBottom: 8,
    color: colors.text,
  },
  profileInfo: {
    fontSize: 16,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 32,
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
    backgroundColor: colors.secondary,
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