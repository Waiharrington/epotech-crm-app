import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottomWidth: 2,
    borderBottomColor: '#2563EB',
    paddingBottom: 20,
  },
  brandName: {
    fontSize: 28,
    color: '#2563EB',
    fontWeight: 'bold',
  },
  brandSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
  },
  quoteTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'right',
  },
  quoteMeta: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'right',
    marginTop: 4,
  },
  clientSection: {
    marginBottom: 30,
  },
  clientLabel: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  clientPhone: {
    fontSize: 10,
    color: '#334155',
    marginTop: 2,
  },
  table: {
    width: 'auto',
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 8,
    borderBottomWidth: 1,
    borderColor: '#cbd5e1',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  colService: { width: '50%' },
  colQty: { width: '15%', textAlign: 'center' },
  colPrice: { width: '15%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },
  tableCellHeader: { fontSize: 10, fontWeight: 'bold', color: '#334155' },
  tableCell: { fontSize: 10, color: '#0f172a' },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  summaryBlock: {
    width: '40%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  summaryLabel: { fontSize: 10, color: '#64748b' },
  summaryValue: { fontSize: 10, color: '#0f172a' },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 2,
    borderColor: '#2563EB',
    marginTop: 4,
  },
  summaryTotalLabel: { fontSize: 12, fontWeight: 'bold', color: '#2563EB' },
  summaryTotalValue: { fontSize: 14, fontWeight: 'bold', color: '#2563EB' },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
  }
});

interface QuotePDFProps {
  quoteId: string;
  date: string;
  client: { nombre: string; apellido: string; telefono?: string };
  items: { id: string; nombre: string; cantidad: number; precio: number }[];
  subtotal: number;
  descuento: number;
  total: number;
}

export const QuotePDF = ({ quoteId, date, client, items, subtotal, descuento, total }: QuotePDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandName}>EPOTECH</Text>
          <Text style={styles.brandSub}>Limpieza y Restauración Profesional</Text>
        </View>
        <View>
          <Text style={styles.quoteTitle}>COTIZACIÓN</Text>
          <Text style={styles.quoteMeta}>#{quoteId.substring(0, 8).toUpperCase()}</Text>
          <Text style={styles.quoteMeta}>Fecha: {date}</Text>
        </View>
      </View>

      {/* Client Info */}
      <View style={styles.clientSection}>
        <Text style={styles.clientLabel}>Preparado para:</Text>
        <Text style={styles.clientName}>{client.nombre} {client.apellido}</Text>
        {client.telefono && <Text style={styles.clientPhone}>Tlf: {client.telefono}</Text>}
      </View>

      {/* Items Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.colService, styles.tableCellHeader]}>Detalle del Servicio</Text>
          <Text style={[styles.colQty, styles.tableCellHeader]}>Cant.</Text>
          <Text style={[styles.colPrice, styles.tableCellHeader]}>P. Unit</Text>
          <Text style={[styles.colTotal, styles.tableCellHeader]}>Total</Text>
        </View>
        
        {items.map((item, i) => (
          <View style={styles.tableRow} key={i}>
            <Text style={[styles.colService, styles.tableCell]}>{item.nombre}</Text>
            <Text style={[styles.colQty, styles.tableCell]}>{item.cantidad}</Text>
            <Text style={[styles.colPrice, styles.tableCell]}>${item.precio}</Text>
            <Text style={[styles.colTotal, styles.tableCell]}>${item.precio * item.cantidad}</Text>
          </View>
        ))}
      </View>

      {/* Summary */}
      <View style={styles.summarySection}>
        <View style={styles.summaryBlock}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>${subtotal}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Descuento:</Text>
            <Text style={styles.summaryValue}>-${descuento}</Text>
          </View>
          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalLabel}>TOTAL:</Text>
            <Text style={styles.summaryTotalValue}>${total}</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Esta cotización tiene una validez de 15 días tras su emisión.</Text>
        <Text style={styles.footerText}>Gracias por confiar en Epotech Solution.</Text>
      </View>
    </Page>
  </Document>
);
