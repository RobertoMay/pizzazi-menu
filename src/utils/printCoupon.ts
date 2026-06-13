const APPLY_LABEL: Record<string, string> = {
  dine_in: 'Comedor', delivery: 'Domicilio', pickup: 'Para llevar',
};

interface PrintCouponOpts {
  qrCanvasId: string;
  code: string;
  discountText: string;
  customerName: string;
  validUntilStr: string;
  couponUrl: string;
  applyTo?: string[];
  maxUses?: number | null;
  branchName?: string;
}

export const printCoupon = ({
  qrCanvasId, code, discountText, customerName,
  validUntilStr, couponUrl, applyTo, maxUses, branchName,
}: PrintCouponOpts) => {
  const qrEl     = document.getElementById(qrCanvasId) as HTMLCanvasElement | null;
  const qrData   = qrEl?.toDataURL('image/png') ?? '';
  const applyStr = applyTo?.length ? applyTo.map(a => APPLY_LABEL[a]).join(', ') : 'Todos los pedidos';

  const logoUrl = `${window.location.origin}/images/logo.png`;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Cupón ${code}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{width:80mm;font-family:'Courier New',monospace;font-size:11px;padding:4mm 4mm 12mm;text-align:center}
      .logo{width:36px;height:36px;margin:0 auto 3px;display:block;object-fit:contain}
      h1{font-size:20px;letter-spacing:4px;margin-bottom:2px}
      .sub{font-size:9px;margin-bottom:6px;color:#555}
      hr{border:none;border-top:1px dashed #000;margin:5px 0}
      .tag{font-size:8px;letter-spacing:1px;text-transform:uppercase;color:#555;margin-bottom:2px}
      .big{font-size:18px;font-weight:bold;margin:3px 0}
      .info{font-size:10px;margin:2px 0}
      .qr{width:140px;height:140px;margin:6px auto;display:block}
      .url{font-size:7px;color:#444;word-break:break-all;margin-top:2px}
      .code{font-size:9px;margin-top:4px;letter-spacing:2px}
      .footer{font-size:8px;margin-top:6px;margin-bottom:4mm}
      @media print{@page{size:80mm auto;margin:0}body{width:80mm}}
    </style></head><body>
    <img src="${logoUrl}" class="logo" />
    <h1>PIZZAZI</h1>
    ${branchName ? `<p class="sub">${branchName}</p>` : ''}
    <hr><p class="tag">Cupón de descuento</p>
    <p class="big">${discountText}</p>
    <hr>
    <p class="info">Para: <strong>${customerName}</strong></p>
    <p class="info">Válido hasta: ${validUntilStr}</p>
    <p class="info">Aplica: ${applyStr}</p>
    <p class="info">Usos: ${maxUses === null || maxUses === undefined ? 'Ilimitado' : maxUses}</p>
    <hr>${qrData ? `<img src="${qrData}" class="qr" />` : ''}
    <p class="url">${couponUrl}</p>
    <p class="code">Cód: ${code}</p>
    <hr><p class="footer">Escanea el QR para validar</p>
  </body></html>`;

  // Usa iframe oculto — más fiable que window.open en producción/HTTPS
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:0;';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) { document.body.removeChild(iframe); return; }

  doc.open();
  doc.write(html);
  doc.close();

  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
    }, 1000);
  };
};
