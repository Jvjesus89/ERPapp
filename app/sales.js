// app/sales.js

import { Colors } from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme
} from 'react-native';

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRight: {
    paddingRight: 5,
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
  saleCard: {
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
  saleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  saleSubtitle: {
    fontSize: 14,
    color: colors.textLight,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 420,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 18,
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: colors.white,
    color: colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  dangerButton: {
    backgroundColor: colors.danger,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'right',
    marginBottom: 16,
    marginTop: 8,
  },
  paymentContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  paymentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  paymentButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8, // Adicionado para espaçamento
  },
  paymentButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  paymentButtonText: {
    color: colors.text,
    fontWeight: '500',
  },
  paymentButtonTextSelected: {
    color: colors.white,
  },
});

export default function SalesScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { activeCompany } = useAuth(); // Obter a empresa ativa

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sales, setSales] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [clienteNome, setClienteNome] = useState('');
  // Estados para itens da venda
  const [itemsModalVisible, setItemsModalVisible] = useState(false);
  const [currentSaleId, setCurrentSaleId] = useState(null); // null indica uma nova venda
  const [currentSaleTotal, setCurrentSaleTotal] = useState(0);
  const [productsOptions, setProductsOptions] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [discount, setDiscount] = useState('0');
  const [saleItems, setSaleItems] = useState([]); // Armazena itens de uma nova venda
  const [editingItemId, setEditingItemId] = useState(null);
  const [paymentOptions, setPaymentOptions] = useState([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(null);

  const computedTotal = useMemo(() => {
    const q = parseFloat(String(quantity).replace(',', '.')) || 0;
    const u = parseFloat(String(unitPrice).replace(',', '.')) || 0;
    const d = parseFloat(String(discount).replace(',', '.')) || 0;
    const total = q * u - d;
    return total > 0 ? total : 0;
  }, [quantity, unitPrice, discount]);

  const openModal = useCallback(() => setModalVisible(true), []);
  const closeModal = useCallback(() => setModalVisible(false), []);
  
  const resetItemForm = useCallback(() => {
    setSelectedProductId(null);
    setQuantity('1');
    setUnitPrice('');
    setDiscount('0');
    setEditingItemId(null);
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Vendas',
      headerRight: () => (
        <TouchableOpacity onPress={openModal} style={styles.headerRight}>
          <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>+ Nova</Text>
        </TouchableOpacity>
      ),
      headerStyle: { backgroundColor: colors.white },
      headerTintColor: colors.text,
      headerTitleStyle: { fontWeight: 'bold' },
      headerBackTitle: 'Voltar',
    });
  }, [navigation, colors, openModal, styles.headerRight]);

  const loadSales = useCallback(async () => {
    // A RLS irá filtrar automaticamente as vendas pela empresa do utilizador
    if (sales.length === 0 && !searchQuery) setLoading(true);
    try {
      const { data, error } = await supabase.from('vendas').select('idvenda, dtvenda, valortotal, idcliente').order('dtvenda', { ascending: false });
      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as vendas');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => { loadSales(); }, [loadSales]);

  const loadProducts = useCallback(async () => {
    // A RLS irá filtrar automaticamente os produtos
    try {
      const { data, error } = await supabase.from('produtos').select('idproduto, descricao, preco').order('descricao', { ascending: true });
      if (error) throw error;
      setProductsOptions(data || []);
    } catch (e) { console.error('Erro ao carregar produtos:', e); }
  }, []);
  
  const loadPaymentOptions = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('formas_pagamento').select('*');
      if (error) throw error;
      setPaymentOptions(data || []);
    } catch (e) { console.error('Erro ao carregar formas de pagamento:', e); }
  }, []);

  const loadSaleItems = useCallback(async (saleId) => {
    try {
      const { data, error } = await supabase.from('vendaitens').select('idvendaitem, idproduto, qtde, vlrunit, desconto, produtos ( descricao )').eq('idvenda', saleId).order('idvendaitem', { ascending: true });
      if (error) throw error;
      setSaleItems(data || []);
    } catch (e) { console.error('Erro ao carregar itens da venda:', e); }
  }, []);

  useEffect(() => {
    if (itemsModalVisible) {
      loadProducts();
      loadPaymentOptions();
      if (currentSaleId) {
        loadSaleItems(currentSaleId);
      }
    }
  }, [itemsModalVisible, currentSaleId, loadProducts, loadSaleItems, loadPaymentOptions]);

  const openExistingSaleItemsModal = useCallback(async (saleId) => {
    try {
        const { data: saleData, error } = await supabase
            .from('vendas')
            .select('idformapagamento')
            .eq('idvenda', saleId)
            .single();
        if (error) throw error;
        setSelectedPaymentMethodId(saleData.idformapagamento);
    } catch (error) {
        console.error("Erro ao buscar detalhes da venda:", error);
        setSelectedPaymentMethodId(null);
    }

    setCurrentSaleId(saleId);
    setItemsModalVisible(true);
    resetItemForm();
  }, [resetItemForm]);

  const handleProceedToItems = useCallback(() => {
    closeModal();
    setClienteNome(prev => prev.trim() || 'Consumidor Final');
    setCurrentSaleId(null);
    setSaleItems([]);
    resetItemForm();
    setItemsModalVisible(true);
    setSelectedPaymentMethodId(null);
  }, [closeModal, resetItemForm]);
  
  useEffect(() => {
    const total = saleItems.reduce((acc, it) => (acc + (Number(it.qtde || 0) * Number(it.vlrunit || 0)) - Number(it.desconto || 0)), 0);
    setCurrentSaleTotal(total);
  }, [saleItems]);
  
  const handleSaveItem = useCallback(async () => {
    if (!activeCompany?.id) {
        Alert.alert('Erro', 'Nenhuma empresa ativa selecionada.');
        return;
    }
    if (!selectedProductId) {
      Alert.alert('Atenção', 'Selecione um produto.');
      return;
    }
    const q = parseFloat(String(quantity).replace(',', '.'));
    if (isNaN(q) || q <= 0) {
      Alert.alert('Atenção', 'Informe uma quantidade válida.');
      return;
    }
    const u = parseFloat(String(unitPrice).replace(',', '.'));
    const d = parseFloat(String(discount || '0').replace(',', '.'));
    
    const itemData = { idproduto: selectedProductId, qtde: q, vlrunit: u, desconto: d, empresa_id: activeCompany.id };

    if (currentSaleId) {
      try {
        const dbData = { ...itemData, idvenda: currentSaleId };
        if (editingItemId) {
          const { error } = await supabase.from('vendaitens').update(dbData).eq('idvendaitem', editingItemId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('vendaitens').insert(dbData);
          if (error) throw error;
        }
        await loadSaleItems(currentSaleId);
      } catch (error) { console.error('Erro ao salvar item:', error); Alert.alert('Erro', 'Não foi possível salvar o item.'); }
    } else {
      const product = productsOptions.find(p => p.idproduto === selectedProductId);
      const itemDataForState = { ...itemData, idvendaitem: editingItemId || `temp_${Date.now()}`, produtos: { descricao: product?.descricao } };
      
      if (editingItemId) {
        setSaleItems(items => items.map(it => it.idvendaitem === editingItemId ? itemDataForState : it));
      } else {
        setSaleItems(items => [...items, itemDataForState]);
      }
    }
    resetItemForm();
  }, [currentSaleId, selectedProductId, quantity, unitPrice, discount, editingItemId, productsOptions, loadSaleItems, resetItemForm, activeCompany]);

  const startEditItem = useCallback((it) => {
    setEditingItemId(it.idvendaitem);
    setSelectedProductId(it.idproduto);
    setQuantity(String(it.qtde ?? '1'));
    setUnitPrice(it.vlrunit != null ? String(it.vlrunit) : '');
    setDiscount(it.desconto != null ? String(it.desconto) : '0');
  }, []);

  const handleDeleteItem = useCallback(async (itemToDelete) => {
    if (currentSaleId) {
      try {
        const { error } = await supabase.from('vendaitens').delete().eq('idvendaitem', itemToDelete.idvendaitem);
        if (error) throw error;
        await loadSaleItems(currentSaleId);
      } catch (e) { Alert.alert('Erro', 'Não foi possível excluir o item.'); }
    } else {
      setSaleItems(items => items.filter(it => it.idvendaitem !== itemToDelete.idvendaitem));
    }
  }, [currentSaleId, loadSaleItems]);

  const handleFinalizeSale = useCallback(async () => {
    if (!activeCompany?.id) {
        Alert.alert('Erro', 'Nenhuma empresa ativa selecionada.');
        return;
    }

    if (currentSaleId) {
        if (!selectedPaymentMethodId) {
            Alert.alert('Atenção', 'Selecione uma forma de pagamento para atualizar a venda.');
            return;
        }
        setIsSaving(true);
        try {
            const { error } = await supabase
              .from('vendas')
              .update({ 
                idformapagamento: selectedPaymentMethodId,
                valortotal: currentSaleTotal 
              })
              .eq('idvenda', currentSaleId);

            if (error) throw error;
            Alert.alert('Sucesso', 'Venda atualizada com sucesso!');
            setItemsModalVisible(false);
            await loadSales();
        } catch (e) {
            console.error('Erro ao atualizar venda:', e);
            Alert.alert('Erro', `Não foi possível atualizar a venda: ${e.message}`);
        } finally {
            setIsSaving(false);
        }
        return;
    }
    
    if (saleItems.length === 0) {
      Alert.alert('Venda Vazia', 'A venda não foi salva pois não continha itens.');
      setItemsModalVisible(false);
      return;
    }
    if (!selectedPaymentMethodId) {
        Alert.alert('Atenção', 'Por favor, selecione uma forma de pagamento.');
        return;
    }

    setIsSaving(true);
    try {
      let clienteIdResolved = null;
      const { data: cliente } = await supabase.from('clientes').select('idcliente').ilike('razao', clienteNome).eq('empresa_id', activeCompany.id).limit(1).single();
      if (cliente) {
        clienteIdResolved = cliente.idcliente;
      } else {
        const { data: novoCliente } = await supabase.from('clientes').insert({ razao: clienteNome, empresa_id: activeCompany.id }).select('idcliente').single();
        if (novoCliente) {
            clienteIdResolved = novoCliente.idcliente;
        }
      }
      
      const saleData = { 
          idcliente: clienteIdResolved, 
          valortotal: currentSaleTotal,
          idformapagamento: selectedPaymentMethodId,
          empresa_id: activeCompany.id // ADICIONADO O CARIMBO DA EMPRESA
      };

      const { data: novaVenda, error: vendaError } = await supabase.from('vendas').insert(saleData).select('idvenda').single();
      if (vendaError) throw vendaError;

      const itemsToInsert = saleItems.map(item => ({ 
          idvenda: novaVenda.idvenda, 
          idproduto: item.idproduto, 
          qtde: item.qtde, 
          vlrunit: item.vlrunit, 
          desconto: item.desconto,
          empresa_id: activeCompany.id // ADICIONADO O CARIMBO DA EMPRESA
      }));
      const { error: itemsError } = await supabase.from('vendaitens').insert(itemsToInsert);
      if (itemsError) throw itemsError;

      Alert.alert('Sucesso', 'Venda salva com sucesso!');
      setItemsModalVisible(false);
      setClienteNome('');
      await loadSales();
    } catch (e) {
      console.error('Erro ao finalizar venda:', e);
      Alert.alert('Erro', `Não foi possível salvar a venda: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  }, [currentSaleId, saleItems, clienteNome, loadSales, selectedPaymentMethodId, currentSaleTotal, activeCompany]);
  
  const handleCancelSale = useCallback(() => {
    setItemsModalVisible(false);
    setClienteNome('');
  }, []);

  const handleDeleteSale = useCallback(async (saleId) => { /* ... */ }, [loadSales]);

  const renderSaleItem = ({ item: it }) => { /* ... */ };
  const renderItem = ({ item }) => { /* ... */ };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput style={styles.searchInput} placeholder="Buscar vendas..." value={searchQuery} onChangeText={setSearchQuery} placeholderTextColor={colors.textLight} />
      </View>
      {loading ? ( <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loadingText}>Carregando vendas...</Text></View>
      ) : sales.length === 0 ? ( <View style={styles.emptyContainer}><Text style={styles.emptyText}>Nenhuma venda encontrada</Text><Text style={styles.emptySubtext}>Crie a sua primeira venda tocando em + Nova</Text></View>
      ) : ( <FlatList data={sales} keyExtractor={(item) => String(item.idvenda)} renderItem={renderItem} contentContainerStyle={styles.listContainer} />
      )}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Iniciar Nova Venda</Text>
            <TextInput style={styles.input} placeholder="Cliente (opcional, padrão: Consumidor Final)" value={clienteNome} onChangeText={setClienteNome} placeholderTextColor={colors.textLight}/>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={closeModal}><Text style={styles.cancelButtonText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleProceedToItems}><Text style={styles.saveButtonText}>Avançar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={itemsModalVisible} transparent animationType="slide" onRequestClose={() => { if (currentSaleId) { handleFinalizeSale(); } else { handleCancelSale(); } }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Itens da Venda {currentSaleId ? `#${currentSaleId}` : `(${clienteNome || 'Consumidor Final'})`}</Text>
            
            <TextInput style={styles.input} placeholder="Buscar produto..." onChangeText={loadProducts} placeholderTextColor={colors.textLight} />
            <FlatList
              data={productsOptions}
              keyExtractor={(p) => String(p.idproduto)}
              horizontal
              showsHorizontalScrollIndicator={false}
              ListEmptyComponent={<Text style={{color: colors.textLight}}>Nenhum produto encontrado.</Text>}
              contentContainerStyle={{ paddingBottom: 8, height: productsOptions.length > 0 ? 'auto' : 0 }}
              renderItem={({ item: p }) => (
                <TouchableOpacity
                  style={[ styles.paymentButton, selectedProductId === p.idproduto && styles.paymentButtonSelected ]}
                  onPress={() => { setSelectedProductId(p.idproduto); setUnitPrice(p.preco != null ? String(p.preco) : ''); }}
                >
                  <Text style={[styles.paymentButtonText, selectedProductId === p.idproduto && styles.paymentButtonTextSelected]} numberOfLines={1}>{p.descricao}</Text>
                </TouchableOpacity>
              )}
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <TextInput style={styles.input} placeholder="Qtd" value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholderTextColor={colors.textLight} />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput style={styles.input} placeholder="Vlr Unit" value={unitPrice} onChangeText={setUnitPrice} keyboardType="numeric" placeholderTextColor={colors.textLight} />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput style={styles.input} placeholder="Desconto (R$)" value={discount} onChangeText={setDiscount} keyboardType="numeric" placeholderTextColor={colors.textLight} />
              </View>
            </View>
            <Text style={{ color: colors.text, marginBottom: 8 }}>Subtotal: R$ {computedTotal.toFixed(2).replace('.', ',')}</Text>

            <TouchableOpacity style={[styles.actionButton, { marginBottom: 12 }]} onPress={handleSaveItem}><Text style={styles.actionButtonText}>{editingItemId ? 'Atualizar Item' : 'Adicionar Item'}</Text></TouchableOpacity>
            
            <FlatList
              data={saleItems}
              style={{maxHeight: 150}}
              keyExtractor={(it) => String(it.idvendaitem)}
              ListEmptyComponent={<Text style={{textAlign: 'center', color: colors.textLight, marginVertical: 20}}>Nenhum item adicionado</Text>}
              renderItem={renderSaleItem}
            />
            
            <Text style={styles.totalText}>Total da Venda: R$ {currentSaleTotal.toFixed(2).replace('.', ',')}</Text>
            
            <View style={styles.paymentContainer}>
              <Text style={styles.paymentLabel}>Forma de Pagamento</Text>
              <FlatList
                  data={paymentOptions}
                  keyExtractor={(method) => String(method.idformapagamento)}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 8 }}
                  renderItem={({ item: method }) => (
                      <TouchableOpacity 
                          style={[styles.paymentButton, selectedPaymentMethodId === method.idformapagamento && styles.paymentButtonSelected]}
                          onPress={() => setSelectedPaymentMethodId(method.idformapagamento)}
                      >
                          <Text style={[styles.paymentButtonText, selectedPaymentMethodId === method.idformapagamento && styles.paymentButtonTextSelected]}>{method.descricao}</Text>
                      </TouchableOpacity>
                  )}
              />
            </View>
            
            <View style={styles.modalButtons}>
              {!currentSaleId && (
                <TouchableOpacity style={[styles.modalButton, styles.dangerButton]} onPress={handleCancelSale}><Text style={styles.saveButtonText}>Cancelar Venda</Text></TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleFinalizeSale} disabled={isSaving}>
                <Text style={styles.saveButtonText}>{isSaving ? 'Salvando...' : 'Concluir'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

