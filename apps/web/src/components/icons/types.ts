import React from 'react';

/**
 * Nazivi svih ikona u ObrtnIQ Sharp Icon Systemu (Faza 12)
 */
export type ObrtIconName =
  // Brending i amblemi
  | 'app-seal'            // Glavni pečat ObrtnIQ (Slika 3: dubrovački lakat, mač, kruna/mozak, Minčeta)
  | 'zigo-emblem'         // Amblem Žigo Agenta (Slika 2: mač, munja, mozak, zupčanik, sidro)
  | 'orlando-knight'      // Vitez Orlando s krunom i mačem (Slika 1, ikona 1)
  | 'core-gear-q'         // Mikročip jezgra s oznakom "Q" (Slika 1, ikona 12)
  
  // Financijski i poslovni moduli
  | 'invoice-document'    // Račun s matematičkim oznakama i eurom (Slika 1, ikona 3)
  | 'crypto-vault'        // Kripto sef s tiskanim krugovima (Slika 1, ikona 5)
  | 'kpr-tower'           // Kula Minčeta s grafikonom rasta (Slika 1, ikona 2 i 6)
  | 'b2b-partners'        // Gradska vrata s rukovanjem partnera (Slika 1, ikona 7)
  | 'catalog-pricing'     // Cjenik s etiketom i zupčanikom (Slika 1, ikona 8)
  | 'fiscal-quill'        // Zupčanik s guščjim perom i ovjerom (Slika 1, ikona 13)
  | 'legal-scales'        // Vaga pravde s hrpom kovanica (Slika 1, ikona 4 i 16)
  | 'obrt-tools'          // Prekriženi čekić i ravnalo majstora (Slika 1, ikona 15)
  | 'bell-deadline'       // Zvono s kalendarom rokova (Slika 1, ikona 10)
  | 'shield-security'     // Štit s ključem i sigurnosnim krugom (Slika 1, ikona 11)
  | 'storno-trash'        // Industrijska kanta sa zupčanicima (Slika 1, ikona 14)

  // Statusni i dijagnostički signali
  | 'signal-error'        // Alarmni štit / crveni signal greške
  | 'signal-warning'      // Trokut upozorenja sa sirenom (Slika 1, ikona 9)
  | 'signal-success'      // Potvrđeni štit s kvačicom
  | 'signal-info'         // Čelični info simbol
  | 'telemetry-terminal'; // Terminalski okvir dnevnika s promptom >_

/**
 * Varijante prikaza ikone
 */
export type ObrtIconVariant = 
  | 'glyph'       // Čisti samostalni vektor simbola (bez okruglog medaljona)
  | 'badge'       // Kružni klesani medaljon s dvostrukim prstenom (kao na Slici 1)
  | 'monochrome'  // Jednobojni prikaz (preuzima currentColor)
  | 'raw';        // Izvorni višeslojni prikaz

/**
 * Režimi obojenja (Color Modes)
 */
export type ObrtColorMode = 
  | 'themed'          // Automatski prati HSL kut teme (--accent-primary, --icon-layer-*)
  | 'gold'            // Dominantno dubrovačko dukatno zlato (#F59E0B)
  | 'steel'           // Hladni klesani čelik i kamen (#94A3B8)
  | 'neon-cyan'       // Kiber-cijan neonsko osvjetljenje (#38BDF8)
  | 'signal-error'    // Crveni alarm (#EF4444)
  | 'signal-warning'  // Jantarno upozorenje (#F59E0B)
  | 'signal-success'; // Smaragdna potvrda (#10B981)

/**
 * Rekviziti za ObrtIcon komponentu
 */
export interface ObrtIconProps extends React.SVGProps<SVGSVGElement> {
  name: ObrtIconName;
  size?: number | string;
  variant?: ObrtIconVariant;
  colorMode?: ObrtColorMode;
  accentColor?: string;
  glow?: boolean;
  isAnimated?: boolean;
  className?: string;
  title?: string;
}

/**
 * Definicija ikone u registru
 */
export interface IconDefinition {
  name: ObrtIconName;
  title: string;
  viewBox: string;
  render: (variant: ObrtIconVariant, colorMode: ObrtColorMode) => React.ReactNode;
}
