import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { LOGO_BASE64 } from './logo-base64';

const brandColor = '#0097A7';
const brandLight = '#E6F9FB';
const darkText = '#1e293b';
const mutedText = '#64748b';
const lightBorder = '#e2e8f0';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 0,
    fontFamily: 'Helvetica',
  },

  // Top accent bar
  accentBar: {
    height: 6,
    backgroundColor: brandColor,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 45,
    paddingTop: 30,
    paddingBottom: 25,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 160,
    height: 51,
  },
  brandBlock: {
    marginLeft: 8,
  },
  brandName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: brandColor,
    letterSpacing: 1,
  },
  brandTagline: {
    fontSize: 8,
    color: mutedText,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  quoteInfoBlock: {
    alignItems: 'flex-end',
  },
  quoteTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: darkText,
    letterSpacing: 2,
  },
  quoteId: {
    fontSize: 9,
    color: mutedText,
    marginTop: 3,
    letterSpacing: 1,
  },
  quoteDate: {
    fontSize: 9,
    color: mutedText,
    marginTop: 2,
  },

  // Divider
  divider: {
    marginHorizontal: 45,
    borderBottomWidth: 1,
    borderBottomColor: lightBorder,
    marginBottom: 25,
  },

  // Client + Intro combined section
  clientSection: {
    marginHorizontal: 45,
    marginBottom: 30,
    backgroundColor: brandLight,
    borderRadius: 8,
    padding: 15,
    borderLeftWidth: 3,
    borderLeftColor: brandColor,
  },
  clientLabel: {
    fontSize: 8,
    color: brandColor,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: darkText,
    marginBottom: 4,
  },
  clientPhone: {
    fontSize: 9,
    color: mutedText,
    marginBottom: 10,
  },
  introDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#b2dfdb',
    marginBottom: 10,
  },
  introText: {
    fontSize: 9,
    color: '#334155',
    lineHeight: 1.6,
  },

  // Table
  tableSection: {
    marginHorizontal: 45,
    marginBottom: 25,
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: brandColor,
    padding: 10,
    borderRadius: 6,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: lightBorder,
  },
  tableRowAlt: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 0.5,
    borderBottomColor: lightBorder,
  },
  tableCell: {
    fontSize: 10,
    color: darkText,
  },
  tableCellBold: {
    fontSize: 10,
    color: darkText,
    fontWeight: 'bold',
  },
  colService: { width: '45%' },
  colQty: { width: '15%', textAlign: 'center' },
  colPrice: { width: '20%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },

  // Summary
  summarySection: {
    marginHorizontal: 45,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 40,
  },
  summaryBlock: {
    width: '45%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  summaryLabel: {
    fontSize: 10,
    color: mutedText,
  },
  summaryValue: {
    fontSize: 10,
    color: darkText,
    fontWeight: '500',
  },
  summaryDivider: {
    borderBottomWidth: 1,
    borderBottomColor: lightBorder,
    marginVertical: 4,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginTop: 4,
    backgroundColor: brandColor,
    borderRadius: 6,
    paddingHorizontal: 10,
  },
  summaryTotalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
  },
  summaryTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },

  // Notes section
  notesSection: {
    marginHorizontal: 45,
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  notesLabel: {
    fontSize: 8,
    color: '#b45309',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: '#92400e',
    lineHeight: 1.5,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: lightBorder,
    paddingHorizontal: 45,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flex: 1,
  },
  footerText: {
    fontSize: 7,
    color: mutedText,
    lineHeight: 1.5,
  },
  footerRight: {
    alignItems: 'flex-end',
  },
  footerBrand: {
    fontSize: 10,
    fontWeight: 'bold',
    color: brandColor,
  },
  footerWebsite: {
    fontSize: 7,
    color: mutedText,
    marginTop: 2,
  },
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
      
      {/* Accent Bar */}
      <View style={styles.accentBar} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoSection}>
          <Image src={LOGO_BASE64} style={styles.logo} />
        </View>
        <View style={styles.quoteInfoBlock}>
          <Text style={styles.quoteTitle}>QUOTE</Text>
          <Text style={styles.quoteId}>#{quoteId.substring(0, 8).toUpperCase()}</Text>
          <Text style={styles.quoteDate}>Date: {date}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Client Info + Intro */}
      <View style={styles.clientSection}>
        <Text style={styles.clientLabel}>Prepared For</Text>
        <Text style={styles.clientName}>{client.nombre} {client.apellido}</Text>
        <View style={styles.introDivider} />
        <Text style={styles.introText}>
          Thank you for your interest in Epotech Solutions. We specialize in high-quality exterior cleaning and property maintenance services. Below you will find a detailed breakdown of the services included in this proposal. All work is performed by trained professionals using commercial-grade equipment and eco-friendly products.
        </Text>
      </View>

      {/* Items Table */}
      <View style={styles.tableSection}>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colService, styles.tableHeaderCell]}>Service Description</Text>
            <Text style={[styles.colQty, styles.tableHeaderCell]}>Qty</Text>
            <Text style={[styles.colPrice, styles.tableHeaderCell]}>Unit Price</Text>
            <Text style={[styles.colTotal, styles.tableHeaderCell]}>Total</Text>
          </View>
          
          {items.map((item, i) => (
            <View style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt} key={i}>
              <Text style={[styles.colService, styles.tableCell]}>{item.nombre}</Text>
              <Text style={[styles.colQty, styles.tableCell]}>{item.cantidad}</Text>
              <Text style={[styles.colPrice, styles.tableCell]}>${item.precio}</Text>
              <Text style={[styles.colTotal, styles.tableCellBold]}>{'$'}{item.precio * item.cantidad}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summarySection}>
        <View style={styles.summaryBlock}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{'$'}{subtotal.toLocaleString()}</Text>
          </View>
          {descuento > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={[styles.summaryValue, { color: '#059669' }]}>-${descuento.toLocaleString()}</Text>
            </View>
          )}
          <View style={styles.summaryDivider} />
          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalLabel}>TOTAL</Text>
            <Text style={styles.summaryTotalValue}>{'$'}{total.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerText}>This quote is valid for 15 days from the issue date.</Text>
          <Text style={styles.footerText}>Thank you for trusting Epotech Solutions.</Text>
        </View>
        <View style={styles.footerRight}>
          <Text style={styles.footerBrand}>EPOTECH SOLUTIONS</Text>
          <Text style={styles.footerWebsite}>www.epotechsolutions.com</Text>
        </View>
      </View>
    </Page>
  </Document>
);
