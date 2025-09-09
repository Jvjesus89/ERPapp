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
});

export default function SalesScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sales, setSales] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [clienteNome, setClienteNome] = useState('');
  // Estados para itens da venda
  const [itemsModalVisible, setItemsModalVisible] = useState(false);
  const [currentSaleId, setCurrentSaleId] = useState(null);
  const [currentSaleTotal, setCurrentSaleTotal] = useState(0);
  const [productsOptions, setProductsOptions] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [discount, setDiscount] = useState('0');
  const [saleItems, setSaleItems] = useState([]);
  const [editingItemId, setEditingItemId] = useState(null);
  const computedTotal = useMemo(() => {
    const q = parseFloat(String(quantity).replace(',', '.')) || 0;
    const u = parseFloat(String(unitPrice).replace(',', '.')) || 0;
    const d = parseFloat(String(discount).replace(',', '.')) || 0;
    const total = q * u - d;
    return total > 0 ? total : 0;
  }, [quantity, unitPrice, discount]);

  const openModal = useCallback(() => setModalVisible(true), []);
  const closeModal = useCallback(() => setModalVisible(false), []);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Vendas',
      headerRight: () => (
        <TouchableOpacity onPress={openModal} style={styles.headerRight}>
          <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>+ Nova</Text>
        </TouchableOpacity>
      ),
      headerStyle: {
        backgroundColor: colors.white,
      },
      headerTintColor: colors.text,
      headerTitleStyle: {
        fontWeight: 'bold',
      },
      headerBackTitle: 'Voltar',
    });
  }, [navigation, colors, openModal, styles.headerRight]);

  const loadSales = useCallback(async () => {
    // Apenas mostra o loading na primeira carga
    if (sales.length === 0 && !searchQuery) {
        setLoading(true);
    }

    try {
      let query = supabase
        .from('Vendas')
        .select('idVenda, dtvenda, valortotal, idusuario, idcliente')
        .order('dtvenda', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as vendas');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]); // Removido sales.length para evitar re-criação desnecessária

  useEffect(() => {
    loadSales();
  }, [loadSales]);


  const loadProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('idproduto, descricao, preco')
        .order('descricao', { ascending: true });
      if (error) throw error;
      setProductsOptions(data || []);
    } catch (e) {
      console.error('Erro ao carregar produtos:', e);
    }
  }, []);

  const filterProducts = useCallback((text) => {
    const t = (text || '').toLowerCase();
    setProductsOptions((prev) => prev.filter((p) => (p.descricao || '').toLowerCase().includes(t)));
    if (!text) {
      loadProducts();
    }
  }, [loadProducts]);

  const loadSaleItems = useCallback(async (saleId) => {
    try {
      const { data, error } = await supabase
        .from('VendaItens')
        .select('idvendaItem, idproduto, qtde, vlrunit, desconto, produtos ( descricao )')
        .eq('idvenda', saleId)
        .order('idvendaItem', { ascending: true });
      if (error) throw error;
      setSaleItems(data || []);
      return data || [];
    } catch (e) {
      console.error('Erro ao carregar itens da venda:', e);
      return [];
    }
  }, []);

  const updateSaleTotal = useCallback(async (saleId) => {
    if (!saleId) return;
    try {
      const items = await loadSaleItems(saleId);
      const total = items.reduce((acc, it) => {
        const q = Number(it.qtde || 0);
        const u = Number(it.vlrunit || 0);
        const d = Number(it.desconto || 0);
        return acc + (q * u - d);
      }, 0);
      
      const { error: updateError } = await supabase.from('Vendas').update({ valortotal: total }).eq('idVenda', saleId);
      if (updateError) throw updateError;
      
      setSales(currentSales =>
        currentSales.map(sale =>
          sale.idVenda === saleId ? { ...sale, valortotal: total } : sale
        )
      );
      setCurrentSaleTotal(total);

    } catch (e) {
      console.error('Erro ao atualizar total da venda:', e);
      Alert.alert('Erro', 'Não foi possível atualizar o total da venda.');
    }
  }, [loadSaleItems]);

  const openItemsModal = useCallback(async (saleId) => {
    setCurrentSaleId(saleId);
    await loadProducts();
    await loadSaleItems(saleId);
    await updateSaleTotal(saleId);
    setSelectedProductId(null);
    setQuantity('1');
    setUnitPrice('');
    setDiscount('0');
    setEditingItemId(null);
    setItemsModalVisible(true);
  }, [loadProducts, loadSaleItems, updateSaleTotal]);

  const handleSaveItem = useCallback(async () => {
    try {
      if (!currentSaleId || !selectedProductId) {
        Alert.alert('Atenção', 'Selecione um produto.');
        return;
      }
      const q = parseFloat(String(quantity).replace(',', '.'));
      const u = parseFloat(String(unitPrice).replace(',', '.'));
      const d = parseFloat(String(discount || '0').replace(',', '.'));
      if (!q || q <= 0) {
        Alert.alert('Atenção', 'Informe uma quantidade válida.');
        return;
      }
      const { error } = await supabase
        .from('VendaItens')
        .insert({ idvenda: currentSaleId, idproduto: selectedProductId, qtde: q, vlrunit: u, desconto: d });
      if (error) throw error;
      
      await updateSaleTotal(currentSaleId);

      setSelectedProductId(null);
      setQuantity('1');
      setUnitPrice('');
      setDiscount('0');
    } catch (_e) {
      console.error('Erro ao adicionar item:', _e);
      Alert.alert('Erro', 'Não foi possível adicionar o item.');
    }
  }, [currentSaleId, selectedProductId, quantity, unitPrice, discount, updateSaleTotal]);

  const startEditItem = useCallback((it) => {
    setEditingItemId(it.idvendaItem);
    setSelectedProductId(it.idproduto);
    setQuantity(String(it.qtde ?? '1'));
    setUnitPrice(it.vlrunit != null ? String(it.vlrunit) : '');
    setDiscount(it.desconto != null ? String(it.desconto) : '0');
  }, []);

  const handleDeleteItem = useCallback(async (idvendaItem) => {
    try {
      if (!currentSaleId) return;
      const { error } = await supabase
        .from('VendaItens')
        .delete()
        .eq('idvendaItem', idvendaItem);
      if (error) throw error;
      await updateSaleTotal(currentSaleId);
    } catch (_e) {
      console.error('Erro ao excluir item:', _e);
      Alert.alert('Erro', 'Não foi possível excluir o item.');
    }
  }, [currentSaleId, updateSaleTotal]);

  // Função unificada para fechar e salvar o modal de itens
  const handleCloseAndSaveItemsModal = useCallback(async () => {
    if (currentSaleId) {
        await updateSaleTotal(currentSaleId);
    }
    setItemsModalVisible(false);
  }, [currentSaleId, updateSaleTotal]);

  const handleDeleteSale = useCallback(async (saleId) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir a Venda #${saleId}? Todos os itens serão perdidos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.from('VendaItens').delete().eq('idvenda', saleId);
              await supabase.from('Vendas').delete().eq('idVenda', saleId);
              await loadSales();
              Alert.alert('Sucesso', 'Venda excluída com sucesso!');
            } catch (_e) {
              console.error('Erro ao excluir venda:', _e);
              Alert.alert('Erro', 'Não foi possível excluir a venda.');
            }
          },
        },
      ]
    );
  }, [loadSales]);

  const createSale = useCallback(async () => {
    try {
      const nomeBusca = clienteNome.trim();
      let clienteIdResolved = null;

      // Lógica para encontrar ou criar cliente
      if (!nomeBusca) {
        const { data: existente, error: errExistente } = await supabase
          .from('clientes')
          .select('idcliente')
          .ilike('razao', 'Consumidor Final')
          .maybeSingle();
        if (errExistente && errExistente.code !== 'PGRST116') throw errExistente;
        if (existente?.idcliente) {
          clienteIdResolved = existente.idcliente;
        } else {
            const { data: criado, error: errCriar } = await supabase
              .from('clientes')
              .insert({ razao: 'Consumidor Final' })
              .select('idcliente')
              .single();
            if (errCriar) throw errCriar;
            clienteIdResolved = criado.idcliente;
        }
      } else {
        const { data: encontrados, error: errBusca } = await supabase
          .from('clientes')
          .select('idcliente, razao')
          .ilike('razao', `%${nomeBusca}%`)
          .limit(1);
        if (errBusca) throw errBusca;
        if (encontrados && encontrados.length > 0) {
          clienteIdResolved = encontrados[0].idcliente;
        } else {
            const { data: criado, error: errCriarNovo } = await supabase
              .from('clientes')
              .insert({ razao: nomeBusca })
              .select('idcliente')
              .single();
            if (errCriarNovo) throw errCriarNovo;
            clienteIdResolved = criado.idcliente;
        }
      }

      // Cria a venda
      const { data: novaVenda, error } = await supabase
        .from('Vendas')
        .insert({ idcliente: clienteIdResolved })
        .select('idVenda')
        .single();
      if (error) throw error;
      
      // Atualiza o valor total para 0 imediatamente após a criação
      await supabase.from('Vendas').update({ valortotal: 0 }).eq('idVenda', novaVenda.idVenda);
      
      closeModal();
      setClienteNome('');
      await loadSales(); 
      
      Alert.alert('Sucesso', 'Venda criada! Adicione itens em seguida.');
      await openItemsModal(novaVenda.idVenda);
    } catch (_e) {
      console.error('Erro ao criar venda:', _e);
      Alert.alert('Erro', `Não foi possível criar a venda. Verifique as suas permissões (RLS). Erro: ${_e.message}`);
    }
  }, [clienteNome, closeModal, loadSales, openItemsModal]);

  const renderItem = ({ item }) => (
    <View style={styles.saleCard}>
      <View style={{ position: 'absolute', right: 8, top: 8 }}>
        <TouchableOpacity onPress={() => handleDeleteSale(item.idVenda)}>
          <Text style={{ color: colors.danger, fontWeight: '700' }}>Excluir</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.saleTitle}>Venda #{item.idVenda}</Text>
      <Text style={styles.saleSubtitle}>Data: {new Date(item.dtvenda).toLocaleDateString('pt-BR')}</Text>
      <Text style={styles.saleSubtitle}>Total: R$ {(item.valortotal || 0).toFixed(2).replace('.', ',')}</Text>
      <View style={{ marginTop: 12 }}>
        <TouchableOpacity style={styles.actionButton} onPress={() => openItemsModal(item.idVenda)}>
          <Text style={styles.actionButtonText}>Visualizar / Editar Itens</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar vendas..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textLight}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando vendas...</Text>
        </View>
      ) : sales.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhuma venda encontrada</Text>
          <Text style={styles.emptySubtext}>Crie a sua primeira venda tocando em + Nova</Text>
        </View>
      ) : (
        <FlatList
          data={sales}
          keyExtractor={(item) => String(item.idVenda)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nova Venda</Text>
            <TextInput
              style={styles.input}
              placeholder="Cliente (nome). Em branco: Consumidor Final"
              value={clienteNome}
              onChangeText={setClienteNome}
              placeholderTextColor={colors.textLight}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={closeModal}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={createSale}>
                <Text style={styles.saveButtonText}>Criar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Modal de Itens da Venda */}
      <Modal visible={itemsModalVisible} transparent animationType="slide" onRequestClose={handleCloseAndSaveItemsModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Itens da Venda #{currentSaleId}</Text>
            <TextInput
              style={styles.input}
              placeholder="Buscar produto (digite para filtrar por descrição)"
              onChangeText={(text) => filterProducts(text)}
              placeholderTextColor={colors.textLight}
            />
            <FlatList
              data={productsOptions}
              keyExtractor={(p) => String(p.idproduto)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 8 }}
              renderItem={({ item: p }) => (
                <TouchableOpacity
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.border,
                    marginRight: 8,
                    backgroundColor: selectedProductId === p.idproduto ? colors.primary : colors.white,
                  }}
                  onPress={() => {
                    setSelectedProductId(p.idproduto);
                    setUnitPrice(p.preco != null ? String(p.preco) : '');
                  }}
                >
                  <Text style={{ color: selectedProductId === p.idproduto ? colors.white : colors.text }} numberOfLines={1}>
                    {p.descricao}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.input}
                  placeholder="Qtd"
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  placeholderTextColor={colors.textLight}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.input}
                  placeholder="Vlr Unit"
                  value={unitPrice}
                  onChangeText={setUnitPrice}
                  keyboardType="numeric"
                  placeholderTextColor={colors.textLight}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.input}
                  placeholder="Desconto (R$)"
                  value={discount}
                  onChangeText={setDiscount}
                  keyboardType="numeric"
                  placeholderTextColor={colors.textLight}
                />
              </View>
            </View>
            <Text style={{ color: colors.text, marginBottom: 8 }}>
              Subtotal: R$ {computedTotal.toFixed(2).replace('.', ',')}
            </Text>
            <TouchableOpacity style={[styles.actionButton, { marginBottom: 12 }]} onPress={handleSaveItem}>
              <Text style={styles.actionButtonText}>{editingItemId ? 'Atualizar Item' : 'Adicionar Item'}</Text>
            </TouchableOpacity>
            <FlatList
              data={saleItems}
              keyExtractor={(it) => String(it.idvendaItem)}
              contentContainerStyle={{ paddingVertical: 4 }}
              renderItem={({ item: it }) => {
                const itemSubtotal = (Number(it.qtde || 0) * Number(it.vlrunit || 0)) - Number(it.desconto || 0);
                return (
                  <TouchableOpacity onPress={() => startEditItem(it)} style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 8,
                    backgroundColor: colors.white,
                  }}>
                    <Text style={{ color: colors.text, fontWeight: '600' }}>{it.produtos?.descricao || `Produto #${it.idproduto}`}</Text>
                    <Text style={{ color: colors.textLight }}>Qtd: {it.qtde}  |  Unit: R$ {Number(it.vlrunit || 0).toFixed(2).replace('.', ',')}  |  Desc: R$ {Number(it.desconto || 0).toFixed(2).replace('.', ',')} |  SubTotal: R$ {itemSubtotal.toFixed(2).replace('.', ',')}</Text>
                    <View style={{ position: 'absolute', right: 8, top: 8 }}>
                      <TouchableOpacity onPress={() => handleDeleteItem(it.idvendaItem)}>
                        <Text style={{ color: colors.danger, fontWeight: '700' }}>Excluir</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                )
              }}
            />
            <Text style={styles.totalText}>
              Total da Venda: R$ {currentSaleTotal.toFixed(2).replace('.', ',')}
            </Text>
            <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleCloseAndSaveItemsModal}>
                    <Text style={styles.saveButtonText}>Concluir</Text>
                </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

