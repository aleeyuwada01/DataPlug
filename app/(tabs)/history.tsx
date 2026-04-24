import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  Alert,
  TextInput,
  Share,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '../../components/GlassCard';
import { useTheme } from '../../contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '../../constants/theme';
import { hexToRgba } from '../../utils/colors';

type FilterType = 'all' | 'data' | 'airtime' | 'wallet';

import { api } from '../../services/api';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'data', label: 'Data' },
  { key: 'airtime', label: 'Airtime' },
  { key: 'wallet', label: 'Wallet' },
];

const ITEMS_PER_PAGE = 5;

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { Colors, isDark } = useTheme();
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreApi, setHasMoreApi] = useState(false);
  
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadTransactions = async (pageToLoad: number, filter: string) => {
    try {
      if (pageToLoad === 1) setLoading(true);
      const res = await api.transactions.getHistory({
        page: pageToLoad,
        limit: ITEMS_PER_PAGE,
        type: filter === 'all' ? undefined : filter,
      });
      
      const formatted = res.transactions.map((t: any) => {
        let icon = 'flash' as const;
        let color = '#34A853';
        let positive = false;
        let title = t.description;

        if (t.type === 'data') {
          icon = 'flash';
          color = '#34A853';
        } else if (t.type === 'airtime') {
          icon = 'call';
          color = '#3B82F6';
        } else if (t.type === 'fund') {
          icon = 'wallet';
          color = '#8B5CF6';
          positive = true;
        }

        return {
          ...t,
          title,
          icon,
          color,
          positive,
          amountStr: `${positive ? '+' : '-'}₦${(t.amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          date: new Date(t.createdAt).toLocaleString(),
          ref: t.reference || `TRX-${t.id}`
        };
      });

      if (pageToLoad === 1) {
        setTransactions(formatted);
      } else {
        setTransactions(prev => [...prev, ...formatted]);
      }
      setHasMoreApi(res.hasMore);
    } catch (err) {
      console.error('Failed to load transactions', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadTransactions(1, activeFilter);
  }, [activeFilter]);

  let filtered = transactions;

  if (searchQuery.trim().length > 0) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(t => 
      t.title?.toLowerCase().includes(query) || 
      t.ref?.toLowerCase().includes(query)
    );
  }

  const displayedData = filtered;
  const hasMore = hasMoreApi;

  const handleFilter = (key: FilterType) => {
    setActiveFilter(key);
    setPage(1); // reset pagination on filter change
    if (Platform.OS !== 'web') Haptics.selectionAsync();
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadTransactions(nextPage, activeFilter);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const openReceipt = (tx: any) => {
    setSelectedTx(tx);
    if (Platform.OS !== 'web') Haptics.selectionAsync();
  };

  const handleShare = async () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (!selectedTx) return;
    
    try {
      const message = `Receipt from DataPlug:\n\nTransaction: ${selectedTx.title}\nAmount: ${selectedTx.amount}\nStatus: ${selectedTx.status.toUpperCase()}\nDate: ${selectedTx.date}\nRef: ${selectedTx.ref}\n\nThank you for using DataPlug!`;
      await Share.share({
        message,
        title: 'Transaction Receipt'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share receipt');
    }
  };

  const handleDownload = () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Download Started", 
      `Receipt ${selectedTx?.ref}.pdf is downloading to your device...`,
      [{ text: "OK", style: "default" }]
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: Colors.background }]}>
      <View style={styles.header}>
        {isSearching ? (
          <View style={[styles.searchBarContainer, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.primary }]}>
            <Ionicons name="search" size={20} color={Colors.primary} />
            <TextInput
              style={[styles.searchInput, { color: Colors.textPrimary }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
              placeholder="Search by ref, title..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity onPress={() => { setIsSearching(false); setSearchQuery(''); }}>
              <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={[styles.title, { color: Colors.textPrimary }]}>History</Text>
            <TouchableOpacity onPress={() => setIsSearching(true)} style={[styles.searchBtn, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.glassBorder }]}>
              <Ionicons name="search-outline" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              onPress={() => handleFilter(filter.key)}
              style={[
                styles.filterChip,
                { 
                  backgroundColor: isActive ? Colors.primaryMuted : Colors.backgroundElevated,
                  borderColor: isActive ? Colors.primary : Colors.glassBorder
                }
              ]}
            >
              <Text style={[
                styles.filterText,
                { color: isActive ? Colors.primary : Colors.textSecondary }
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Transactions List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {loading && page === 1 ? (
          <View style={{ paddingVertical: 60, alignItems: 'center', gap: 12 }}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={{ color: Colors.textMuted, ...Typography.small }}>Loading transactions...</Text>
          </View>
        ) : displayedData.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={Colors.textMuted} />
            <Text style={[styles.emptyText, { color: Colors.textMuted }]}>No transactions found.</Text>
          </View>
        ) : (
          displayedData.map((item, index) => (
            <TouchableOpacity key={item.id} activeOpacity={0.7} onPress={() => openReceipt(item)}>
              <GlassCard delay={index * 50} style={styles.transCard}>
                <View style={styles.transRow}>
                  <View style={[styles.transIcon, { backgroundColor: hexToRgba(item.color, 0.08) }]}>
                    <Ionicons name={item.icon} size={18} color={item.color} />
                  </View>
                  <View style={styles.transInfo}>
                    <Text style={[styles.transTitle, { color: Colors.textPrimary }]}>{item.title}</Text>
                    <View style={styles.transMetaRow}>
                      <Text style={[styles.transDate, { color: Colors.textMuted }]}>{item.date}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          item.status === 'success' || item.status === 'completed' && { backgroundColor: 'rgba(52, 168, 83, 0.12)' },
                          item.status === 'pending' && { backgroundColor: 'rgba(245, 158, 11, 0.12)' },
                          item.status === 'failed' && { backgroundColor: 'rgba(239, 68, 68, 0.12)' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            item.status === 'success' || item.status === 'completed' && { color: Colors.success },
                            item.status === 'pending' && { color: Colors.warning },
                            item.status === 'failed' && { color: Colors.error },
                          ]}
                        >
                          {item.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={[styles.transAmount, { color: item.positive ? Colors.success : Colors.textPrimary }]}>
                    {item.amountStr}
                  </Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))
        )}

        {hasMore && (
          <TouchableOpacity style={[styles.loadMoreBtn, { borderColor: Colors.primary }]} onPress={handleLoadMore}>
            <Text style={[styles.loadMoreText, { color: Colors.primary }]}>Load More</Text>
            <Ionicons name="chevron-down" size={16} color={Colors.primary} />
          </TouchableOpacity>
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Receipt Modal */}
      <Modal visible={!!selectedTx} animationType="slide" transparent={true} onRequestClose={() => setSelectedTx(null)}>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.receiptContainer, { backgroundColor: Colors.backgroundElevated }]}>
            
            <View style={styles.receiptHeader}>
              <Text style={[styles.receiptTitle, { color: Colors.textPrimary }]}>Transaction Receipt</Text>
              <TouchableOpacity onPress={() => setSelectedTx(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedTx && (
              <View style={styles.receiptBody}>
                <Image 
                  source={{ uri: 'https://i.ibb.co/Kx2611sf/iconlight.png' }} 
                  style={{ width: 40, height: 40, tintColor: isDark ? '#FFFFFF' : '#000000', marginBottom: Spacing.md }} 
                  resizeMode="contain" 
                />
                <View style={[styles.receiptIconWrap, { backgroundColor: hexToRgba(selectedTx.color, 0.08) }]}>
                  <Ionicons name={selectedTx.icon} size={32} color={selectedTx.color} />
                </View>
                <Text style={[styles.receiptAmount, { color: Colors.textPrimary }]}>{selectedTx.amountStr}</Text>
                
                <View style={[
                  styles.statusBadge, 
                  { alignSelf: 'center', marginBottom: Spacing.xl },
                  selectedTx.status === 'success' || selectedTx.status === 'completed' && { backgroundColor: 'rgba(52, 168, 83, 0.12)' },
                  selectedTx.status === 'pending' && { backgroundColor: 'rgba(245, 158, 11, 0.12)' },
                  selectedTx.status === 'failed' && { backgroundColor: 'rgba(239, 68, 68, 0.12)' },
                ]}>
                  <Text style={[
                    styles.statusText,
                    selectedTx.status === 'success' || selectedTx.status === 'completed' && { color: Colors.success },
                    selectedTx.status === 'pending' && { color: Colors.warning },
                    selectedTx.status === 'failed' && { color: Colors.error },
                  ]}>{selectedTx.status.toUpperCase()}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: Colors.textMuted }]}>Details</Text>
                  <Text style={[styles.receiptValue, { color: Colors.textPrimary }]}>{selectedTx.title}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: Colors.textMuted }]}>Date</Text>
                  <Text style={[styles.receiptValue, { color: Colors.textPrimary }]}>{selectedTx.date}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: Colors.textMuted }]}>Reference</Text>
                  <Text style={[styles.receiptValue, { color: Colors.textPrimary }]}>{selectedTx.ref}</Text>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.primaryMuted }]} onPress={handleDownload}>
                    <Ionicons name="download-outline" size={20} color={Colors.primary} />
                    <Text style={[styles.actionText, { color: Colors.primary }]}>Download</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.primary }]} onPress={handleShare}>
                    <Ionicons name="share-social-outline" size={20} color="#FFF" />
                    <Text style={[styles.actionText, { color: '#FFF' }]}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, height: 64 },
  title: { ...Typography.h1 },
  searchBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  searchBarContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', height: 44, borderRadius: BorderRadius.pill, borderWidth: 1, paddingHorizontal: Spacing.md },
  searchInput: { flex: 1, marginLeft: Spacing.sm, ...Typography.body },
  
  filtersContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  filterChip: { flex: 1, marginHorizontal: 4, paddingVertical: Spacing.sm, borderRadius: BorderRadius.pill, borderWidth: 1, alignItems: 'center' },
  filterText: { ...Typography.captionBold, fontSize: 12 },
  
  listContent: { paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { ...Typography.body, marginTop: Spacing.sm },
  
  transCard: { padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1 },
  transRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  transIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  transInfo: { flex: 1 },
  transTitle: { ...Typography.bodyBold, marginBottom: 4 },
  transMetaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  transDate: { ...Typography.small },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  transAmount: { ...Typography.h3 },

  loadMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.md, marginTop: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, borderStyle: 'dashed' },
  loadMoreText: { ...Typography.button, fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  receiptContainer: { borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, padding: Spacing.xl, paddingBottom: 40, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 },
  receiptHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  receiptTitle: { ...Typography.h2 },
  closeBtn: { padding: 4 },
  
  receiptBody: { alignItems: 'center' },
  receiptIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  receiptAmount: { ...Typography.hero, marginBottom: 4 },
  receiptStatus: { ...Typography.captionBold, letterSpacing: 1, marginBottom: Spacing.xl },
  
  divider: { width: '100%', height: 1, backgroundColor: 'rgba(150,150,150,0.2)', marginBottom: Spacing.lg, borderStyle: 'dashed' },
  
  receiptRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  receiptLabel: { ...Typography.body },
  receiptValue: { ...Typography.bodyBold },

  actionRow: { width: '100%', flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: BorderRadius.lg },
  actionText: { ...Typography.button, fontSize: 16 },
});
