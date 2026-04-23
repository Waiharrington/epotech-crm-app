'use client'

import { useState, useEffect } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { QuotePDF } from './quote-pdf'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'

// Internal type mirroring the props we passed out
interface QuotePDFDownloadProps {
  quoteId: string;
  date: string;
  client: { nombre: string; apellido: string; telefono?: string };
  items: { id: string; nombre: string; cantidad: number; precio: number }[];
  subtotal: number;
  descuento: number;
  total: number;
  variant?: "outline" | "default" | "ghost";
  size?: "default" | "sm" | "icon";
  className?: string;
  showText?: boolean;
}

export default function QuotePDFDownload(props: QuotePDFDownloadProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <Button variant={props.variant || "outline"} size={props.size || "sm"} className={props.className} disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    )
  }

  return (
    <PDFDownloadLink
      document={<QuotePDF {...props} />}
      fileName={`Cotizacion_${props.client.nombre}_${props.quoteId.substring(0, 6)}.pdf`}
    >
      {({ loading }) => (
        <Button 
            variant={props.variant || "outline"} 
            size={props.size || "sm"} 
            className={props.className}
            disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className={props.showText ? "mr-2 h-4 w-4" : "h-4 w-4"} />
          )}
          {props.showText && "PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  )
}
