# Sabir OUSSAOUI - Professional Portfolio

A modern, animated portfolio website showcasing your research, publications, and professional experience in Climate Change, Remote Sensing, and AI.

## 🎨 Features

- **Responsive Design**: Fully responsive layout that works on desktop, tablet, and mobile devices
- **Smooth Animations**: Beautiful CSS animations and scroll effects
- **Interactive Navigation**: Smooth scrolling between sections with active link highlighting
- **Publications Gallery**: Filterable publication cards (Journal Articles / Conferences)
- **Article Detail Pages**: Individual pages for each publication with full details
- **Skills Visualization**: Animated progress bars showing expertise levels
- **Professional Sections**:
  - Hero section with profile image
  - About section with statistics
  - Education timeline
  - Professional experience cards
  - Publications with filtering
  - Skills & expertise
  - Honors & awards
  - Contact information

## 📁 Project Structure

```
portfolio/
│
├── index.html              # Main portfolio page
├── article.html            # Article detail page template
├── styles.css              # Main stylesheet with animations
├── article-styles.css      # Article page specific styles
├── script.js               # Main JavaScript functionality
├── article-script.js       # Article page JavaScript
├── README.md               # This file
│
└── assets/
    ├── profile.png         # Your profile image
    └── CV_OUSSAOUI.pdf    # Your CV (downloadable)
```

## 🚀 How to Use

### Option 1: Open Directly in Browser
1. Navigate to the `portfolio` folder
2. Double-click `index.html` to open in your default browser
3. The portfolio will load with all your information

### Option 2: Use a Local Server (Recommended)
For best results, use a local web server:

**Using Python:**
```bash
cd c:\Users\sabir\Desktop\meryem_choukri\portfolio
python -m http.server 8000
```
Then open `http://localhost:8000` in your browser

**Using Node.js (if installed):**
```bash
cd c:\Users\sabir\Desktop\meryem_choukri\portfolio
npx http-server
```

## 🎯 Sections Overview

### 1. **Hero Section**
- Your profile picture with animated border
- Name and title
- Institution affiliation
- Download CV button
- Social media links

### 2. **About Section**
- Professional summary
- Languages you speak
- Statistics cards (publications, conferences, students trained, awards)

### 3. **Education Section**
- Timeline-based layout
- All your academic degrees from PhD to high school
- Thesis titles and institutions

### 4. **Experience Section**
- Professional internships and positions
- Key responsibilities and achievements
- Organized in card format

### 5. **Publications Section**
- Filterable by type (All / Journal Articles / Conferences)
- 5 Q1 journal articles
- 4 conference presentations
- Click any publication to view full details

### 6. **Skills Section**
- Four categories:
  - Remote Sensing
  - GIS & Geospatial
  - AI & Machine Learning
  - Specializations
- Animated progress bars

### 7. **Awards Section**
- IWRA Silver Membership Award (2025)
- Top 3 Project Award - IWRI Hackathon (2025)

### 8. **Contact Section**
- Email, phone, location
- Institution information

## 📝 Publications Included

### Journal Articles (Q1)
1. **Hydrometeorological Drought Severity Composite Index** (IF: 7.4, Citations: 5)
2. **Temporal Relationships Between Agricultural and Meteorological Drought** (Big Earth Data, IF: 7.2)
3. **Mapping Drought Severity Impact on Arboriculture Systems** (Geocarto International, IF: 7.2)
4. **Analysis of Meteorological Drought Propagation** (Remote Sensing, IF: 5.3)
5. **Optimizing Sugar Beet Crop Management** (Smart Agricultural Technology, IF: 4.2)

### Conferences
- XIX World Water Congress, IWRA, Marrakech (2025)
- Doctoral Days, UM6P (2025)
- EO Workshop on Climate Impacts, AfEOP Project (2025)
- 6th IAHR Africa Congress (2024)

## 🎨 Customization

### Update Your Information
All your information is already integrated from your CV. To make changes:

1. **Personal Information**: Edit `index.html` in the hero and contact sections
2. **Profile Image**: Replace `assets/profile.png` with a new image
3. **CV File**: Replace `assets/CV_OUSSAOUI.pdf` with an updated CV
4. **Publications**: Edit the `articles` object in `script.js` to add/modify publications
5. **Colors**: Modify CSS variables in `styles.css` under `:root` section

### Color Scheme
The current color scheme uses:
- Primary: Blue (#2563eb)
- Secondary: Dark Blue (#1e40af)
- Gradients: Purple to blue

To change colors, edit the `:root` section in `styles.css`:
```css
:root {
    --primary-color: #2563eb;    /* Change this */
    --secondary-color: #1e40af;   /* Change this */
    /* ... */
}
```

## 📱 Social Media Links

Update your social media links in `index.html`:
```html
<div class="social-links">
    <a href="mailto:Sabir.OUSSAOUI@um6p.ma">Email</a>
    <a href="tel:+212667685262">Phone</a>
    <a href="YOUR_LINKEDIN_URL">LinkedIn</a>
    <a href="YOUR_SCHOLAR_URL">Google Scholar</a>
</div>
```

## 🌐 Publishing Your Portfolio

### Option 1: GitHub Pages (Free)
1. Create a GitHub repository
2. Upload all portfolio files
3. Enable GitHub Pages in repository settings
4. Your site will be at `https://yourusername.github.io/repository-name`

### Option 2: Netlify (Free)
1. Go to netlify.com
2. Drag and drop the `portfolio` folder
3. Get a free URL instantly

### Option 3: Your Own Domain
- Upload files to any web hosting service
- Point your domain to the hosting

## 🔧 Technical Details

- **No dependencies required**: Pure HTML, CSS, and JavaScript
- **Font Awesome Icons**: Loaded via CDN
- **Modern CSS**: Flexbox, Grid, CSS Variables, Animations
- **Vanilla JavaScript**: No frameworks needed
- **Cross-browser compatible**: Works on all modern browsers

## 📊 Performance

- Lightweight: Fast loading times
- Optimized animations
- Lazy loading for images
- Smooth scrolling performance

## 🎓 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## 📧 Contact

For questions or support with this portfolio:
- Email: Sabir.OUSSAOUI@um6p.ma
- Phone: +212 667 685 262

## 📄 License

This portfolio is created for Sabir OUSSAOUI. Feel free to customize and use it for your professional needs.

---

**Created with Claude Code** - February 2025
