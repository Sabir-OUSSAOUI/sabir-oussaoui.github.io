// ===== NAVIGATION =====
const navbar = document.getElementById('navbar');
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

// Navbar scroll effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile menu toggle
hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
});

// Close mobile menu when clicking on a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    });
});

// Smooth scrolling for navigation links
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);

        if (targetSection) {
            const offsetTop = targetSection.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Active navigation link on scroll
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section');

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.clientHeight;

        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// ===== PUBLICATIONS FILTER =====
const filterButtons = document.querySelectorAll('.filter-btn');
const publicationCards = document.querySelectorAll('.publication-card');

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons
        filterButtons.forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        button.classList.add('active');

        const filter = button.getAttribute('data-filter');

        publicationCards.forEach(card => {
            if (filter === 'all') {
                card.style.display = 'block';
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'scale(1)';
                }, 10);
            } else {
                const category = card.getAttribute('data-category');
                if (category === filter) {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1)';
                    }, 10);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.8)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            }
        });
    });
});

// ===== ARTICLE NAVIGATION =====
function openArticle(articleId) {
    // Store article ID in sessionStorage
    sessionStorage.setItem('currentArticle', articleId);
    // Navigate to article page
    window.location.href = `article.html?id=${articleId}`;
}

// ===== SCROLL ANIMATIONS =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe all elements that should animate on scroll
document.addEventListener('DOMContentLoaded', () => {
    const animateElements = document.querySelectorAll(
        '.timeline-item, .experience-card, .publication-card, .skill-category, .award-card, .stat-card'
    );

    animateElements.forEach(el => {
        el.classList.add('animate-on-scroll');
        observer.observe(el);
    });

    // Animate skill bars when visible
    const skillCategories = document.querySelectorAll('.skill-category');
    const skillObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const skillBars = entry.target.querySelectorAll('.skill-progress');
                skillBars.forEach(bar => {
                    const width = bar.style.width;
                    bar.style.width = '0';
                    setTimeout(() => {
                        bar.style.width = width;
                    }, 200);
                });
                skillObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    skillCategories.forEach(category => {
        skillObserver.observe(category);
    });

    // Animate stat numbers
    const statCards = document.querySelectorAll('.stat-card');
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumber = entry.target.querySelector('.stat-number');
                const targetText = statNumber.textContent;
                const hasPlus = targetText.includes('+');
                const number = parseInt(targetText.replace('+', ''));

                animateNumber(statNumber, 0, number, 1500, hasPlus);
                statsObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    statCards.forEach(card => {
        statsObserver.observe(card);
    });
});

// ===== NUMBER ANIMATION =====
function animateNumber(element, start, end, duration, hasPlus = false) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current) + (hasPlus ? '+' : '');
    }, 16);
}

// ===== PARALLAX EFFECT =====
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.hero-content');

    parallaxElements.forEach(element => {
        const speed = 0.5;
        element.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// ===== TYPING EFFECT (Optional Enhancement) =====
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.textContent = '';

    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }

    type();
}

// ===== SMOOTH SCROLL TO TOP =====
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Create scroll to top button
const scrollTopBtn = document.createElement('button');
scrollTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
scrollTopBtn.className = 'scroll-top-btn';
scrollTopBtn.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
    color: white;
    border: none;
    cursor: pointer;
    display: none;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);
    transition: all 0.3s ease;
    z-index: 1000;
    font-size: 1.2rem;
`;

document.body.appendChild(scrollTopBtn);

scrollTopBtn.addEventListener('click', scrollToTop);

// Show/hide scroll to top button
window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        scrollTopBtn.style.display = 'flex';
        scrollTopBtn.style.opacity = '1';
    } else {
        scrollTopBtn.style.opacity = '0';
        setTimeout(() => {
            if (window.pageYOffset <= 300) {
                scrollTopBtn.style.display = 'none';
            }
        }, 300);
    }
});

scrollTopBtn.addEventListener('mouseenter', () => {
    scrollTopBtn.style.transform = 'translateY(-5px) scale(1.1)';
});

scrollTopBtn.addEventListener('mouseleave', () => {
    scrollTopBtn.style.transform = 'translateY(0) scale(1)';
});

// ===== CURSOR EFFECT (Optional Enhancement) =====
const cursor = document.createElement('div');
cursor.className = 'custom-cursor';
cursor.style.cssText = `
    width: 20px;
    height: 20px;
    border: 2px solid #2563eb;
    border-radius: 50%;
    position: fixed;
    pointer-events: none;
    z-index: 9999;
    transition: transform 0.2s ease;
    display: none;
`;

document.body.appendChild(cursor);

document.addEventListener('mousemove', (e) => {
    cursor.style.display = 'block';
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
});

// Interactive elements cursor effect
const interactiveElements = document.querySelectorAll('a, button, .publication-card, .experience-card');
interactiveElements.forEach(element => {
    element.addEventListener('mouseenter', () => {
        cursor.style.transform = 'scale(1.5)';
        cursor.style.backgroundColor = 'rgba(37, 99, 235, 0.2)';
    });

    element.addEventListener('mouseleave', () => {
        cursor.style.transform = 'scale(1)';
        cursor.style.backgroundColor = 'transparent';
    });
});

// ===== ARTICLE DATA =====
const articles = {
    pub6: {
        title: "Seasonal Forecasting of Dam Water Resources Using Optimized Hybrid Models Under Unprecedented Drought Conditions",
        authors: "Sabir Oussaoui, et al.",
        journal: "Journal of Hydrology: Regional Studies",
        year: "2025",
        citations: "0",
        impactFactor: "7.4",
        abstract: "This study presents a novel approach for seasonal forecasting of dam water resources using optimized hybrid models under unprecedented drought conditions. The research addresses the critical challenge of water resource management in the face of climate variability and extreme drought events. By combining advanced forecasting techniques with optimization algorithms, the study provides reliable predictions for dam water availability, essential for water resource planning and management.",
        keywords: ["Dam water resources", "Seasonal forecasting", "Hybrid models", "Drought conditions", "Water management"],
        methodology: "The methodology employs hybrid models combining statistical and machine learning approaches. Various forecasting techniques including time series analysis, neural networks, and ensemble methods were tested and optimized to predict seasonal dam water levels. Historical data on precipitation, temperature, evapotranspiration, and dam inflow-outflow were used to train and validate the models.",
        results: "The optimized hybrid models demonstrated superior performance compared to traditional forecasting methods, with improved accuracy in predicting dam water resources even under unprecedented drought conditions. The models successfully captured the complex dynamics of water availability and provided reliable seasonal forecasts.",
        conclusions: "The developed hybrid forecasting framework offers a powerful tool for dam water resource management under changing climate conditions. The approach enhances decision-making capabilities for water allocation, drought preparedness, and long-term water resource planning.",
        doi: "https://doi.org/10.1016/j.ejrh.2025.103091"
    },
    pub5: {
        title: "Development of a Hydrometeorological Drought Severity Composite Index",
        authors: "Hanadé Hoummad, Ismaguil, Abdessamad Hadri, Abdelghani Boudhar, El Mahdi El Khalki, Ismail Karaoui, Sabir Oussaoui, Samih Mohamed, and Christophe Kinnard",
        journal: "Journal of Hydrology: Regional Studies",
        year: "2025",
        citations: "5",
        impactFactor: "7.4",
        abstract: "This study presents the development of a novel hydrometeorological drought severity composite index based on the integration of multisource characteristics and an explainable artificial intelligence model. The research combines various drought indicators from meteorological, hydrological, and remote sensing data to create a comprehensive drought assessment tool. The explainable AI approach ensures transparency in the model's decision-making process, making it valuable for water resource management and drought monitoring in Morocco and similar semi-arid regions.",
        keywords: ["Drought monitoring", "Composite index", "Explainable AI", "Hydrometeorological drought", "Remote sensing"],
        methodology: "The methodology integrates multiple data sources including precipitation data, temperature records, soil moisture measurements, and vegetation indices from satellite imagery. Machine learning algorithms were employed to combine these indicators into a single composite index, with explainable AI techniques ensuring interpretability of the results.",
        results: "The developed composite index demonstrated high accuracy in detecting and quantifying drought severity across different temporal and spatial scales. The explainable AI component successfully identified the most influential factors contributing to drought conditions, providing valuable insights for decision-makers.",
        conclusions: "The hydrometeorological drought severity composite index offers a robust tool for drought monitoring and early warning systems. Its integration of multisource data and explainable AI makes it particularly useful for water resource planning and agricultural management in regions facing increasing drought risks.",
        doi: "https://doi.org/10.1016/j.ejrh.2025.102623"
    },
    pub4: {
        title: "Temporal Relationships Between Agricultural and Meteorological Drought",
        authors: "Hanadé Houmma, Ismaguil, Abdessamad Hadri, Abdelghani Boudhar, El Mahdi El Khalki, Sabir Oussaoui, Ismail Karaoui, Azzeddine El Midaoui, and Christophe Kinnard",
        journal: "Big Earth Data",
        year: "2025",
        citations: "4",
        impactFactor: "7.2",
        abstract: "This research investigates the temporal relationships between agricultural and meteorological drought over the Oum Er Rbia River basin in Morocco. The study analyzes the lag time between meteorological drought onset and its impact on agricultural systems, providing crucial information for drought preparedness and response strategies. Using time series analysis and correlation techniques, the research quantifies how quickly meteorological drought conditions translate into agricultural impacts.",
        keywords: ["Agricultural drought", "Meteorological drought", "Temporal analysis", "Oum Er Rbia", "Drought propagation"],
        methodology: "The study employed standardized precipitation index (SPI) for meteorological drought and vegetation condition index (VCI) derived from MODIS satellite data for agricultural drought. Time series analysis and cross-correlation techniques were used to determine the lag times between the two drought types across different seasons and crop types.",
        results: "Results revealed variable lag times ranging from 1 to 3 months depending on the season and crop type. Winter crops showed faster response to meteorological drought compared to summer crops. The spatial analysis identified regions with higher vulnerability to rapid drought propagation.",
        conclusions: "Understanding the temporal relationships between meteorological and agricultural drought is essential for developing effective early warning systems. The identified lag times provide a critical window for implementing mitigation measures and adapting agricultural practices to minimize drought impacts.",
        doi: "https://doi.org/10.1080/20964471.2025.2479430"
    },
    pub3: {
        title: "Mapping Drought Severity Impact on Arboriculture Systems Using Machine Learning",
        authors: "Sabir Oussaoui, Abdelghani Boudhar, Abdessamad Hadri, Youssef Lebrini, Ismaguil Hanadé Houmma, Ismail Karaoui, El Mahdi El Khalki, Jamal-eddine Ouzemou & Christophe Kinnard",
        journal: "Geocarto International",
        year: "2025",
        citations: "3",
        impactFactor: "7.2",
        abstract: "This study maps drought severity impact on arboriculture systems over Tadla and lower Tassaout plains in Morocco using Sentinel-2 data and machine learning approaches. The research develops a comprehensive methodology for assessing how drought conditions affect tree crops, particularly olive and citrus orchards. By integrating high-resolution satellite imagery with machine learning algorithms, the study provides spatially explicit information about drought stress on perennial crops.",
        keywords: ["Arboriculture", "Drought severity", "Sentinel-2", "Machine learning", "Morocco", "Tree crops"],
        methodology: "Sentinel-2 multispectral imagery was processed to extract vegetation indices including NDVI, EVI, and MSAVI. Machine learning algorithms (Random Forest, Support Vector Machines, and Neural Networks) were trained using field survey data to classify drought stress levels. The spatial analysis covered the entire Tadla and lower Tassaout irrigation perimeters.",
        results: "The Random Forest classifier achieved the highest accuracy (89%) in mapping drought severity classes. Results showed that approximately 35% of arboriculture areas experienced moderate to severe drought stress during the study period. Citrus orchards were found to be more vulnerable than olive groves due to their higher water requirements.",
        conclusions: "The integration of Sentinel-2 data with machine learning provides an efficient and scalable approach for monitoring drought impacts on arboriculture systems. The methodology can be adapted to other agricultural regions and supports precision irrigation management and drought response planning.",
        doi: "https://doi.org/10.1080/10106049.2025.2471104"
    },
    pub2: {
        title: "Analysis of Meteorological Drought Propagation to Hydrological Drought",
        authors: "Houmma, Ismaguil Hanadé, Abdessamad Hadri, Abdelghani Boudhar, Ismail Karaoui, Sabir Oussaoui, El Mahdi El Khalki, Abdelghani Chehbouni, and Christophe Kinnard",
        journal: "Remote Sensing",
        year: "2025",
        citations: "2",
        impactFactor: "5.3",
        abstract: "This research analyzes the propagation characteristics of meteorological drought to hydrological drought and their joint effects on low-flow drought variability in the Oum Er Rbia Watershed, Morocco. The study examines how atmospheric water deficits translate into reduced streamflow and reservoir levels, providing insights into water resource vulnerability. Understanding these propagation mechanisms is crucial for integrated water resources management in semi-arid regions.",
        keywords: ["Drought propagation", "Hydrological drought", "Low-flow", "Oum Er Rbia", "Water resources"],
        methodology: "The study utilized long-term precipitation records, temperature data, and streamflow measurements. Standardized Precipitation Index (SPI) and Standardized Runoff Index (SRI) were calculated at multiple time scales. Wavelet analysis and cross-wavelet transforms were employed to identify propagation patterns and periodicities in drought occurrences.",
        results: "Analysis revealed significant propagation delays ranging from 2 to 6 months depending on watershed characteristics and antecedent conditions. The joint occurrence of meteorological and hydrological drought intensified low-flow conditions, with combined effects exceeding the sum of individual impacts. Seasonal variations in propagation times were identified.",
        conclusions: "The findings enhance understanding of drought propagation mechanisms in semi-arid watersheds. The identified propagation delays provide valuable lead time for water resource managers to implement conservation measures. The research supports the development of integrated drought monitoring systems that account for both meteorological and hydrological aspects.",
        doi: "https://doi.org/10.3390/rs17020281"
    },
    pub1: {
        title: "Optimizing Sugar Beet Crop Management: Integrating Satellite Imagery",
        authors: "Ouzemou, Jamal-Eddine, El Harti, Abderrazak, El Hachimi, Jaouad, Lhissou, Rachid and OUSSAOUI, Sabir",
        journal: "Smart Agricultural Technology",
        year: "2024",
        citations: "1",
        impactFactor: "4.2",
        abstract: "This study develops precision agriculture approaches for optimizing sugar beet crop management by integrating satellite imagery. The research demonstrates how remote sensing data can enhance crop monitoring, yield prediction, and resource optimization for sugar beet cultivation. By providing farmers and agricultural managers with timely, spatially-explicit information, the methodology supports improved decision-making throughout the growing season.",
        keywords: ["Sugar beet", "Precision agriculture", "Satellite imagery", "Crop management", "Yield prediction"],
        methodology: "Multi-temporal Sentinel-2 imagery was analyzed to monitor sugar beet crop development. Vegetation indices and biophysical parameters were derived to assess crop vigor and stress conditions. Machine learning models were developed to predict yield based on spectral signatures and environmental variables. Field validation was conducted across multiple farms.",
        results: "The satellite-based monitoring system successfully identified spatial variability in crop performance, enabling site-specific management interventions. Yield prediction models achieved R² values of 0.82, demonstrating good agreement with actual harvest data. Early-season stress detection allowed for timely corrective actions.",
        conclusions: "Integration of satellite imagery into sugar beet crop management provides significant benefits for precision agriculture. The approach enables more efficient use of water, fertilizers, and other inputs while maintaining or improving yields. The methodology is scalable and can be implemented across different agricultural regions.",
        doi: "https://doi.org/10.2139/ssrn.4570968"
    },
    conf6: {
        title: "Mapping Drought Severity Impact on Arboriculture Systems",
        authors: "Oussaoui, Sabir, Abdelghani Boudhar, Abdessamad Hadri, Youssef Lebrini, Ismaguil Hanadé Houmma, Ismail Karaoui, El Mahdi El Khalki, Jamal-eddine Ouzemou, and Christophe Kinnard",
        conference: "XIX World Water Congress, International Water Resources Association (IWRA)",
        location: "Marrakech, Morocco",
        year: "2025",
        type: "Poster Presentation",
        abstract: "This poster presentation showcased research on mapping drought severity impact on arboriculture systems over Tadla and Lower Tassaout plains in Morocco using Sentinel-2 data and machine learning approaches. The work was presented at the prestigious XIX World Water Congress organized by the International Water Resources Association (IWRA) in Marrakech, Morocco, December 1-5, 2025.",
        description: "The presentation highlighted the methodology for assessing drought impacts on tree crops using high-resolution satellite imagery combined with machine learning classification algorithms. Attendees from around the world engaged with the research findings, providing valuable feedback on the application of these techniques in different geographical contexts."
    },
    conf5: {
        title: "Remote Sensing and Machine Learning for Drought Severity Assessment",
        authors: "Oussaoui, Sabir, Abdelghani Boudhar, Abdessamad Hadri, Youssef Lebrini, Ismaguil Hanadé Houmma, Ismail Karaoui, El Mahdi El Khalki, Jamal-eddine Ouzemou, and Christophe Kinnard",
        conference: "Doctoral Days, UM6P - University Mohammed VI Polytechnic",
        location: "Ben Guerir, Morocco",
        year: "2025",
        type: "Poster Presentation",
        abstract: "Presented research on remote sensing and machine learning applications for drought severity assessment in arboriculture systems of the Tadla and Lower Tassaout Plains, Morocco at the UM6P Doctoral Days event.",
        description: "The Doctoral Days at UM6P provided an excellent platform to present ongoing PhD research to fellow doctoral students, faculty members, and industry partners. The presentation emphasized the integration of Sentinel-2 satellite data with advanced machine learning algorithms to monitor and assess drought impacts on agricultural systems."
    },
    conf4: {
        title: "Earth Observation Workshop on Assessing Climate Impacts",
        authors: "Oussaoui, Sabir, Abdelghani Boudhar, Abdessamad Hadri, Youssef Lebrini, Ismaguil Hanadé Houmma, Ismail Karaoui, El Mahdi El Khalki, Jamal-eddine Ouzemou, and Christophe Kinnard",
        conference: "Earth Observation (EO) Workshop on Assessing Climate Impacts Across Africa, AfEOP Project",
        location: "UM6P-MIT",
        year: "2025",
        type: "Poster Presentation",
        abstract: "Presented research on mapping drought severity impact using Earth observation data at the EO Workshop focused on assessing climate impacts across Africa. The workshop was part of the African Earth Observation Platform (AfEOP) project, a collaboration between UM6P and MIT.",
        description: "This workshop brought together researchers working on Earth observation applications for climate change assessment across the African continent. The presentation demonstrated how high-resolution satellite data can be used to monitor drought impacts on agricultural systems, with particular emphasis on transferability of methods to other African regions facing similar climate challenges."
    },
    conf2: {
        title: "Spatial Assessment of Drought Impact on Agricultural Systems",
        authors: "Oussaoui, S.; Boudhar, A.; Hadri, A.; Lebrini, Y.; Houmma, I.H.; Karaoui, I.; Kinnard, C.; El Khalki, E.M.; Ouzemou, J.E.; El Midaoui, A.; Chehbouni, A.",
        conference: "6th International Association for Hydro-Environment Engineering and Research (IAHR) Africa Congress",
        location: "Benguerir-Marrakech, Morocco",
        year: "2024",
        type: "Conference Presentation",
        abstract: "Presented research on spatial assessment of the impact of drought on agricultural systems in the irrigated perimeter of Tadla and Tassaout, with special focus on the response time of arboriculture systems to drought conditions.",
        description: "The 6th IAHR Africa Congress provided an international platform to present research on drought impacts in agricultural systems. The presentation covered methodology for spatial assessment using remote sensing data, analysis of drought propagation in irrigated areas, and quantification of response times for different crop types. The work received significant interest from water resources engineers and agricultural researchers across Africa."
    }
};

// Export articles data for use in article page
if (typeof window !== 'undefined') {
    window.articlesData = articles;
}

// ===== DIRECT LINK TO PUBLICATIONS =====
function openlink(pubId) {
    const links = {
        pub6: "https://doi.org/10.1016/j.ejrh.2025.103091",
        pub5: "https://doi.org/10.1016/j.ejrh.2025.102623",
        pub4: "https://doi.org/10.1080/20964471.2025.2479430",
        pub3: "https://doi.org/10.1080/10106049.2025.2471104",
        pub2: "https://doi.org/10.3390/rs17020281",
        pub1: "https://doi.org/10.2139/ssrn.4570968"
    };

    if (links[pubId]) {
        window.open(links[pubId], "_blank");
    } else {
        console.error("No link found for:", pubId);
    }
}

console.log('Portfolio script loaded successfully!');
