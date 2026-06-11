const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

export const buildWaLink = (phone: string, message: string) => {
  const digits  = phone.replace(/\D/g, '');
  const waPhone = digits.length === 10 ? `521${digits}` : digits;
  const encoded = encodeURIComponent(message);
  // wa.me abre la app directamente en móvil; en desktop pasa por una landing page
  // que rompe los emojis — web.whatsapp.com/send va directo a WhatsApp Web
  return isMobile()
    ? `https://wa.me/${waPhone}?text=${encoded}`
    : `https://web.whatsapp.com/send?phone=${waPhone}&text=${encoded}`;
};

export const openWhatsApp = (phone: string, message: string) => {
  window.open(buildWaLink(phone, message), '_blank');
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const shareImage = async (
  qrCanvasId: string,
  couponCode: string,
  customerName: string,
  discountText: string,
  validUntilStr: string,
  couponUrl: string,
): Promise<void> => {
  const blob     = await buildShareImage(qrCanvasId, couponCode, customerName, discountText, validUntilStr, couponUrl);
  const filename = `cupon-${couponCode}.png`;

  // Móvil: selector nativo (abre WhatsApp, Telegram, etc.)
  // Desktop: siempre descarga — el selector nativo en desktop requiere WhatsApp Desktop instalado
  if (isMobile()) {
    const file = new File([blob], filename, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return;
      } catch { /* cancelado */ }
    }
  }

  downloadBlob(blob, filename);
};

// Emojis definidos por código Unicode para evitar problemas de encoding en el archivo fuente
const EM = {
  party:    '\u{1F389}', // 🎉
  pizza:    '\u{1F355}', // 🍕
  calendar: '\u{1F4C5}', // 📅
  down:     '\u{1F447}', // 👇
};

export const buildWaMessage = (
  customerName: string,
  discountText: string,
  validUntilStr: string,
  couponUrl: string,
) => [
  `${EM.party} ¡Hola ${customerName}!`,
  '',
  `Tienes un cupón especial en *Pizzazi*:`,
  `${EM.pizza} *${discountText}*`,
  `${EM.calendar} Válido hasta: ${validUntilStr}`,
  '',
  `Muestra este QR al momento de pagar ${EM.down}`,
  couponUrl,
].join('\n');

// ── Canvas helpers ──────────────────────────────────────────────────


const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
};

const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

export const buildShareImage = async (
  qrCanvasId: string,
  couponCode: string,
  customerName: string,
  discountText: string,
  validUntilStr: string,
  couponUrl: string,
): Promise<Blob> => {
  const SCALE   = 2;
  const W       = 440;
  const PAD     = 32;
  const INNER   = W - PAD * 2;

  // Medir líneas del texto de descuento
  const tmp = document.createElement('canvas').getContext('2d')!;
  tmp.font  = `bold 24px Arial, sans-serif`;
  const discLines = wrapText(tmp, discountText, INNER);

  const QR_SIZE   = 200;
  const LINE_H    = 30;
  const H = 28 + 18 + 14 + 18        // PIZZAZI + gap + subtítulo + gap
          + discLines.length * LINE_H + 8  // descuento
          + 24 + 1 + 20              // para: + divider + gap
          + QR_SIZE + 24 + 1 + 20   // qr + gap + divider + gap
          + 22 + 18 + 18 + 24;      // válido + url + código + bottom padding

  const canvas  = document.createElement('canvas');
  canvas.width  = W * SCALE;
  canvas.height = H * SCALE;
  const ctx     = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);

  // Fondo blanco
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  let y = 28;

  // PIZZAZI
  ctx.fillStyle = '#111827';
  ctx.font      = 'bold 22px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '6px';
  ctx.fillText('PIZZAZI', W / 2, y);
  ctx.letterSpacing = '0px';
  y += 18;

  // Divider
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
  y += 14;

  // Subtítulo rojo
  ctx.fillStyle = '#ef4444';
  ctx.font      = 'bold 11px Arial, sans-serif';
  ctx.fillText('CUPÓN DE DESCUENTO', W / 2, y);
  y += 20;

  // Texto de descuento
  ctx.fillStyle = '#111827';
  ctx.font      = `bold 24px Arial, sans-serif`;
  for (const line of discLines) {
    ctx.fillText(line, W / 2, y + LINE_H - 6);
    y += LINE_H;
  }
  y += 8;

  // Para: nombre
  ctx.fillStyle = '#6b7280';
  ctx.font      = '14px Arial, sans-serif';
  ctx.fillText(`Para: ${customerName}`, W / 2, y);
  y += 24;

  // Divider
  ctx.strokeStyle = '#e5e7eb';
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
  y += 20;

  // QR con fondo gris redondeado
  const qrEl = document.getElementById(qrCanvasId) as HTMLCanvasElement | null;
  if (qrEl) {
    const qrX = (W - QR_SIZE) / 2;
    ctx.fillStyle = '#f3f4f6';
    roundRect(ctx, qrX - 12, y - 10, QR_SIZE + 24, QR_SIZE + 20, 14);
    ctx.fill();
    ctx.drawImage(qrEl, qrX, y, QR_SIZE, QR_SIZE);
  }
  y += QR_SIZE + 24;

  // Divider
  ctx.strokeStyle = '#e5e7eb';
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
  y += 20;

  // Válido hasta
  ctx.fillStyle = '#6b7280';
  ctx.font      = '13px Arial, sans-serif';
  ctx.fillText(`Válido hasta: ${validUntilStr}`, W / 2, y);
  y += 18;

  // URL
  ctx.fillStyle = '#9ca3af';
  ctx.font      = '10px monospace';
  const shortUrl = couponUrl.length > 52 ? couponUrl.slice(0, 52) + '…' : couponUrl;
  ctx.fillText(shortUrl, W / 2, y);
  y += 18;

  // Código
  ctx.fillText(`Código: ${couponCode}`, W / 2, y);

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('Error al generar imagen')), 'image/png')
  );
};
