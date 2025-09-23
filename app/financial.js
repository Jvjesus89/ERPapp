// app/financial.js

import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useFocusEffect, useNavigation } from 'expo-router';
import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    View,
    useColorScheme
} from 'react-native';

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success,
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textLight,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
});

export default function FinancialScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState([]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Financeiro',
      headerStyle: { backgroundColor: colors.white },
      headerTintColor: colors.text,
      headerTitleStyle: { fontWeight: 'bold' },
      headerBackTitle: 'Voltar',
    });
  }, [navigation, colors]);

  const loadFinancialRecords = useCallback(async () => {
    try {
      let query = supabase
        .from('financeiro')
        .select(`
          idfinanceiro,
          valor,
          dtvencimento,
          tipo,
          clientes ( razao ),
          formas_pagamento ( descricao ),
          idvenda
        `)
        .order('dtvencimento', { ascending: false });

      if (searchQuery.trim()) {
        query = query.ilike('clientes.razao', `%${searchQuery.trim()}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Erro ao carregar registros financeiros:', error);
      Alert.alert('Erro', 'Não foi possível carregar os registros financeiros.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadFinancialRecords();
    }, [loadFinancialRecords])
  );

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Lançamento #{item.idfinanceiro}</Text>
      <Text style={styles.cardSubtitle}>Cliente: {item.clientes?.razao || 'N/A'}</Text>
      <Text style={styles.cardSubtitle}>Venda de Origem: #{item.idvenda || 'N/A'}</Text>
      <Text style={styles.cardSubtitle}>Forma de Pagamento: {item.formas_pagamento?.descricao || 'N/A'}</Text>
      <Text style={styles.cardSubtitle}>Vencimento: {new Date(item.dtvencimento).toLocaleDateString('pt-BR')}</Text>
      <Text style={styles.cardValue}>R$ {(item.valor || 0).toFixed(2).replace('.', ',')}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome do cliente..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textLight}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando financeiro...</Text>
        </View>
      ) : records.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhum lançamento encontrado</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery ? `Nenhum resultado para "${searchQuery}"` : 'As vendas irão gerar lançamentos financeiros aqui.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => String(item.idfinanceiro)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}
