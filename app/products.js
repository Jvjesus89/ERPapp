import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useNavigation } from 'expo-router';

// Função que cria os estilos de acordo com o tema
const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  listContainer: {
    padding: 16,
  },
  productCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
      width: 60,
      height: 60,
      borderRadius: 8,
      marginRight: 12,
      backgroundColor: '#f0f0f0',
  },
  productInfo: {
    flex: 1,
  },
  productDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  productCode: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#ffc107',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  actionButtonText: {
      fontSize: 16
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
    maxWidth: 400,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 18,
    color: colors.text,
  },
  scanButton: {
    backgroundColor: colors.secondary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  scanButtonText: {
      color: colors.white,
      fontWeight: '600'
  },
  modalImage: {
      width: '100%',
      height: 150,
      borderRadius: 8,
      marginBottom: 15,
      resizeMode: 'contain',
      backgroundColor: '#f0f0f0'
  },
  modalImagePlaceholder: {
      width: '100%',
      height: 150,
      borderRadius: 8,
      marginBottom: 15,
      backgroundColor: '#f0f0f0',
      justifyContent: 'center',
      alignItems: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: colors.white,
    color: colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    fontWeight: '500',
  },
  eanInstructions: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 10,
  },
  eanInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: colors.white,
    color: colors.text,
  },
  eanExamples: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 20,
    lineHeight: 20,
  },
});

export default function ProductsScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estados do formulário
  const [codigo, setCodigo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');

  // Estados do Scanner
  const [hasPermission, setHasPermission] = useState(null);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [eanModalVisible, setEanModalVisible] = useState(false);
  const [eanCode, setEanCode] = useState('');
  const [searchingEan, setSearchingEan] = useState(false);

  // Helpers do formulário e modal (antes do useLayoutEffect para evitar TDZ)
  const resetForm = useCallback(() => {
    setCodigo('');
    setDescricao('');
    setPreco('');
    setFotoUrl('');
    setEditingProduct(null);
  }, []);

  const openModal = useCallback((product = null) => {
    if (product) {
      setEditingProduct(product);
      setCodigo(product.codigo || '');
      setDescricao(product.descricao || '');
      setPreco(product.preco ? product.preco.toString() : '');
      setFotoUrl(product.foto_url || '');
    } else {
      resetForm();
    }
    setModalVisible(true);
  }, [resetForm]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Produtos',
      headerRight: () => (
        <TouchableOpacity onPress={() => openModal()} style={{ paddingRight: 5 }}>
          <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>+ Adicionar</Text>
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
  }, [navigation, colors.primary, colors.text, colors.white, openModal]);

  

  const loadProducts = useCallback(async () => {
    try {
      if (!products.length && !searchQuery) {
        setLoading(true);
      }
      
      let query = supabase
        .from('produtos')
        .select('*')
        .order('descricao', { ascending: true });

      if (searchQuery.trim()) {
        query = query.ilike('descricao', `%${searchQuery.trim()}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      } else {
        setProducts(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os produtos');
    } finally {
      setLoading(false);
    }
  }, [products.length, searchQuery]);
  
  useEffect(() => {
    const searchDebounce = setTimeout(() => {
      loadProducts();
    }, 300);

    return () => clearTimeout(searchDebounce);
  }, [searchQuery, loadProducts]);
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  

  

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const saveProduct = async () => {
    if (!descricao.trim()) {
      Alert.alert('Erro', 'A descrição é obrigatória');
      return;
    }

    const precoValue = preco ? parseFloat(preco.replace(',', '.')) : null;

    const productData = {
        codigo: codigo.trim() || null,
        descricao: descricao.trim(),
        preco: precoValue,
        foto_url: fotoUrl.trim() || null,
    };

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('produtos')
          .update(productData)
          .eq('idproduto', editingProduct.idproduto);

        if (error) throw error;

        Alert.alert('Sucesso', 'Produto atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('produtos')
          .insert({ ...productData, dtcadastro: new Date().toISOString().split('T')[0] });

        if (error) throw error;
        Alert.alert('Sucesso', 'Produto adicionado com sucesso!');
      }
      closeModal();
      loadProducts();

    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      Alert.alert('Erro', 'Não foi possível salvar o produto. Verifique suas permissões no Supabase (RLS).');
    }
  };

  const deleteProduct = (product) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir o produto "${product.descricao}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('produtos')
                .delete()
                .eq('idproduto', product.idproduto);

              if (error) throw error;
              
              Alert.alert('Sucesso', 'Produto excluído com sucesso!');
              loadProducts();

            } catch (error) {
              console.error('Erro ao excluir produto:', error);
              Alert.alert('Erro', 'Não foi possível excluir o produto.');
            }
          }
        }
      ]
    );
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) return 'R$ 0,00';
    return `R$ ${parseFloat(price).toFixed(2).replace('.', ',')}`;
  };

  const renderProduct = ({ item }) => (
    <View style={styles.productCard}>
      <Image
        style={styles.productImage}
        source={item.foto_url ? { uri: item.foto_url } : require('../assets/images/adaptive-icon.png')}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productDescription} numberOfLines={2}>{item.descricao}</Text>
        {item.codigo && (
          <Text style={styles.productCode}>Código: {item.codigo}</Text>
        )}
        <Text style={styles.productPrice}>{formatPrice(item.preco)}</Text>
      </View>
      <View style={styles.productActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]} 
          onPress={() => openModal(item)}
        >
          <Text style={styles.actionButtonText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]} 
          onPress={() => deleteProduct(item)}
        >
          <Text style={styles.actionButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleBarCodeScanned = async (code) => {
    setSearchingEan(true);
    setEanModalVisible(false);

    try {
        const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
        const json = await response.json();
        
        if (json.status === 1) {
            const product = json.product;
            setDescricao(product.product_name_pt || product.product_name || '');
            setFotoUrl(product.image_front_url || product.image_url || '');
            setCodigo(code); // Salva o código de barras
            Alert.alert('✅ Produto Encontrado!', 'Os dados foram preenchidos automaticamente.');
        } else {
            Alert.alert('❌ Produto não encontrado', 'Não foi possível encontrar o produto na base de dados. Preencha manualmente.');
            setCodigo(code);
        }
    } catch (error) {
        console.error("Erro ao buscar na API Open Food Facts:", error);
        Alert.alert('❌ Erro na API', 'Houve um problema ao buscar os dados do produto.');
        setCodigo(code);
    } finally {
        setSearchingEan(false);
    }
  };

  const openScanner = async () => {
    // Verifica se está no web
    if (Platform.OS === 'web') {
      Alert.alert('Funcionalidade não disponível', 'O scanner de código de barras não está disponível na versão web. Use o app no dispositivo móvel.');
      return;
    }

    setEanCode('');
    setEanModalVisible(true);
  };

  const searchEanCode = () => {
    if (!eanCode.trim()) {
      Alert.alert('Erro', 'Digite um código EAN válido');
      return;
    }
    
    if (eanCode.trim().length < 8) {
      Alert.alert('Erro', 'O código EAN deve ter pelo menos 8 dígitos');
      return;
    }

    handleBarCodeScanned(eanCode.trim());
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por descrição..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textLight}
        />
      </View>

      {loading && products.length === 0 ? (
        <ThemedView style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Carregando produtos...</Text>
        </ThemedView>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhum produto cadastrado</Text>
          <Text style={styles.emptySubtext}>Toque em &quot;Adicionar&quot; para cadastrar seu primeiro produto</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.idproduto.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal para adicionar/editar produto */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </ThemedText>

            <TouchableOpacity style={styles.scanButton} onPress={openScanner}>
                <Text style={styles.scanButtonText}>📷 Buscar por Código</Text>
            </TouchableOpacity>
            
            {fotoUrl ? (
                <Image source={{ uri: fotoUrl }} style={styles.modalImage} />
            ) : (
                <View style={styles.modalImagePlaceholder}>
                    <Text style={{color: colors.textLight}}>Sem Imagem</Text>
                </View>
            )}

            <TextInput
              style={styles.input}
              placeholder="URL da Foto"
              value={fotoUrl}
              onChangeText={setFotoUrl}
              placeholderTextColor={colors.textLight}
            />

            <TextInput
              style={styles.input}
              placeholder="Código (GTIN)"
              value={codigo}
              onChangeText={setCodigo}
              placeholderTextColor={colors.textLight}
            />

            <TextInput
              style={styles.input}
              placeholder="Descrição *"
              value={descricao}
              onChangeText={setDescricao}
              placeholderTextColor={colors.textLight}
            />

            <TextInput
              style={styles.input}
              placeholder="Preço (ex: 10.50)"
              value={preco}
              onChangeText={setPreco}
              keyboardType="numeric"
              placeholderTextColor={colors.textLight}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={closeModal}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={saveProduct}
              >
                <Text style={styles.saveButtonText}>
                  {editingProduct ? 'Atualizar' : 'Salvar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para entrada de código EAN */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={eanModalVisible}
        onRequestClose={() => setEanModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              🔍 Buscar Produto por Código EAN
            </ThemedText>

            <Text style={styles.eanInstructions}>
              Digite o código de barras do produto para buscar automaticamente as informações:
            </Text>

            <TextInput
              style={styles.eanInput}
              placeholder="Ex: 7891000100103"
              value={eanCode}
              onChangeText={setEanCode}
              keyboardType="numeric"
              maxLength={13}
              placeholderTextColor={colors.textLight}
            />

            <Text style={styles.eanExamples}>
              📋 Exemplos de códigos para teste:
              {'\n'}• 7891000100103 (Leite Condensado)
              {'\n'}• 7891000053508 (Biscoito Recheado)
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setEanModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={searchEanCode}
                disabled={searchingEan}
              >
                <Text style={styles.saveButtonText}>
                  {searchingEan ? '🔍 Buscando...' : '🔍 Buscar Produto'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}