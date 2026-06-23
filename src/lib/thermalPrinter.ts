import { Equipe } from './raidEngine';

/**
 * 7. Sorties Web : Impression format ticket thermique 80mm
 * Génère une fenêtre pop-up ou un iframe invisible avec un style CSS spécifique 
 * au format ticket de caisse et déclenche l'impression.
 */
export function printTicketThermique(equipe: Equipe, lignes: { label: string, value: string }[], totalInfo: string) {
  // Créer un iframe pour ne pas altérer le DOM principal
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const htmlContent = `
    <html>
      <head>
        <title>Ticket de Course</title>
        <style>
          /* Style pour impression 80mm */
          @page {
            margin: 0;
            size: 80mm auto;
          }
          body {
            margin: 0;
            padding: 5mm;
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            color: #000;
            background: #fff;
            width: 70mm; /* 80mm - margins */
          }
          h1, h2 {
            text-align: center;
            margin: 5px 0;
          }
          h1 {
            font-size: 16px;
            font-weight: bold;
            text-transform: uppercase;
          }
          h2 {
            font-size: 14px;
          }
          .divider {
            border-bottom: 1px dashed #000;
            margin: 8px 0;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          .total {
            font-size: 14px;
            font-weight: bold;
            text-align: right;
            margin-top: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <h1>RAID MULTISPORT</h1>
        <h2>Ticket de Course</h2>
        <div class="divider"></div>
        <div class="row"><span>Equipe:</span><span>${equipe.nom}</span></div>
        <div class="row"><span>Dossard:</span><span>${equipe.dossard}</span></div>
        <div class="row"><span>Cat:</span><span>${equipe.categorie}</span></div>
        <div class="divider"></div>
        
        ${lignes.map(l => `
          <div class="row">
            <span>${l.label}</span>
            <span>${l.value}</span>
          </div>
        `).join('')}
        
        <div class="divider"></div>
        <div class="total">${totalInfo}</div>
        
        <div class="footer">Merci de votre participation !<br/>${new Date().toLocaleString('fr-FR')}</div>
      </body>
    </html>
  `;

  doc.open();
  doc.write(htmlContent);
  doc.close();

  // Attendre le chargement puis imprimer
  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    
    // Nettoyage après impression
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  };
}
