# ONE ROOF - Site Web Immobilier de Luxe

Site web one-page luxueux et sobre pour One Roof, entreprise marocaine d'investissement immobilier familiale spécialisée dans l'acquisition et la location de biens immobiliers premium.

## 🎨 Caractéristiques Principales

### Design & Esthétique
- **Style**: Luxe contemporain minimaliste avec élégance méditerranéenne
- **Palette de couleurs**:
  - Navy Blue (#1E3A5F) - Couleur principale
  - Or (#C9A961) - Accents premium
  - Blanc cassé (#FAFAF8) - Fond élégant
- **Typographie**:
  - Titres: Cormorant Garamond (Serif élégante)
  - Corps: Inter (Sans-serif moderne)
- **Layout**: Asymétrique avec espaces respirants, ratio d'or

### Sections
1. **Hero** - Section d'accueil plein écran avec effet parallax subtil
2. **À Propos** - Storytelling familial avec valeurs d'excellence et confiance
3. **Approche** - Processus d'investissement en 4 étapes visuelles
4. **Portfolio** - Grille de propriétés avec filtres élégants et effets hover
5. **Avantages** - Icônes personnalisées et statistiques animées
6. **Contact** - Formulaire épuré avec carte du Maroc interactive

### Animations & Interactions
- ✨ Scroll reveal progressif avec effet de décalage
- 🎭 Parallax multi-couches sur hero et sections clés
- 🎯 États hover sophistiqués (transitions 300-400ms)
- 🔄 Micro-interactions sur CTA et éléments interactifs
- 📊 Animations de compteurs pour statistiques
- 🖱️ Smooth scroll avec indicateur de progression

### Caractéristiques Techniques
- 📱 **Responsive Design**: Mobile-first (breakpoints: 375px, 768px, 1440px)
- 🎨 **Design System**: Variables CSS pour cohérence
- ⚡ **Performance Optimisée**: 
  - Lazy loading images
  - Code splitting
  - Animations GPU-accelerated (transform, opacity)
- ♿ **Accessibilité**: WCAG 2.1 AA minimum
- 🎯 **Navigation**: 
  - Menu sticky avec backdrop blur
  - Barre de progression de scroll
  - Menu mobile responsive

## 🚀 Installation

### Prérequis
Aucun! Le site utilise uniquement HTML, CSS et JavaScript vanilla.

### Utilisation Locale
1. Clonez ou téléchargez le repository
2. Ouvrez `index.html` dans votre navigateur

```bash
# Option 1: Ouvrir directement
open index.html

# Option 2: Serveur local simple (Python)
python -m http.server 8000

# Option 3: Serveur local (Node.js)
npx serve
```

## 📁 Structure du Projet

```
/workspace/
├── index.html          # Structure HTML principale
├── styles.css          # Tous les styles et animations
├── script.js           # Interactions et animations JavaScript
└── README.md          # Documentation
```

## 🎯 Fonctionnalités JavaScript

### Navigation
- Menu sticky avec effet blur au scroll
- Barre de progression de lecture
- Menu mobile hamburger avec animation
- Navigation smooth scroll

### Animations
- **Scroll Reveal**: Apparition progressive des éléments au scroll
- **Parallax**: Effet de profondeur sur la section hero
- **Compteurs Animés**: Animation des statistiques
- **Filtres Portfolio**: Filtrage animé des propriétés

### Interactions
- Effets hover avancés sur les cartes
- Effet ripple sur les boutons
- Gestion de formulaire avec feedback visuel
- Accessibilité clavier complète

## 🎨 Personnalisation

### Couleurs
Modifiez les variables CSS dans `:root` (styles.css):
```css
:root {
  --color-navy: #1E3A5F;
  --color-gold: #C9A961;
  --color-cream: #FAFAF8;
}
```

### Typographie
Changez les polices dans les imports Google Fonts (index.html) et les variables CSS:
```css
:root {
  --font-serif: 'Cormorant Garamond', serif;
  --font-sans: 'Inter', sans-serif;
}
```

### Espacement
Système basé sur le ratio d'or:
```css
:root {
  --space-xs: 0.5rem;
  --space-sm: 0.809rem;
  --space-md: 1.309rem;
  --space-lg: 2.118rem;
  --space-xl: 3.427rem;
  --space-2xl: 5.545rem;
  --space-3xl: 8.972rem;
}
```

## 📱 Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px
- **Small Mobile**: < 375px

## ♿ Accessibilité

- Navigation au clavier complète
- Focus visible pour tous les éléments interactifs
- Attributs ARIA appropriés
- Support de `prefers-reduced-motion`
- Contraste des couleurs WCAG AA
- Structure sémantique HTML5

## 🔧 Optimisations Performances

- Variables CSS pour réutilisation
- Animations GPU-accelerated
- Debounce sur événements scroll
- Intersection Observer pour animations
- Lazy loading des images
- Code minifiable et compressible

## 📝 Contenu Portfolio

Le portfolio inclut 6 propriétés exemple:
- **Villas**: Villa Azur (Casablanca), Villa Horizon (Tanger)
- **Appartements**: Résidence Atlas (Marrakech), Sky Residence (Rabat)
- **Riads**: Riad Sérénité (Fès), Riad Palmeraie (Marrakech)

Pour ajouter des biens, dupliquez la structure `.portfolio-item` dans index.html.

## 🎭 Animations Personnalisées

### Fade In Up
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Pulse (Marqueur carte)
```css
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}
```

## 🌐 Navigateurs Supportés

- Chrome/Edge (dernières versions)
- Firefox (dernières versions)
- Safari (dernières versions)
- Opera (dernières versions)

## 📧 Formulaire de Contact

Le formulaire est fonctionnel côté frontend avec validation. Pour l'intégrer à un backend:

1. Ajoutez l'attribut `action` au formulaire
2. Configurez l'endpoint de votre backend
3. Ou intégrez un service comme Formspree, Netlify Forms, ou EmailJS

## 🚀 Déploiement

### Netlify
```bash
# Déployez directement depuis Git
netlify deploy --prod
```

### Vercel
```bash
# Déployez avec Vercel CLI
vercel --prod
```

### GitHub Pages
1. Poussez le code sur GitHub
2. Activez GitHub Pages dans les paramètres
3. Sélectionnez la branche main

## 📄 License

Ce projet est créé pour One Roof. Tous droits réservés.

## 🤝 Contribution

Pour toute amélioration ou suggestion:
1. Créez une issue détaillée
2. Proposez une pull request
3. Suivez les conventions de code existantes

---

**Développé avec ❤️ pour One Roof**  
*Patrimoine Familial · Excellence Immobilière · Héritage Pérenne*
