## folder structure:

```
src
│   android-chrome-192x192.png
│   android-chrome-512x512.png
│   apple-touch-icon.png
│   blog.njk
│   CNAME
│   favicon-16x16.png
│   favicon-32x32.png
│   favicon.ico
│   gallery.njk
│   index.njk
│   portfolio.njk
│   robots.txt
│   site.webmanifest
│   sitemap.njk
│   
├───posts
│       eos.md
│       hello-world.md
│       i-hate-men.md
│       posts.json
│       
├───static
│   ├───css
│   │       base.css
│   │       blog.css
│   │       home.css
│   │       nav.css
│   │       post.css
│   │       variables.css
│   │       
│   ├───fonts
│   │       AllenSans-Light.ttf
│   │       Elltaneixy.otf
│   │       Vicitys Gytura.otf
│   │       
│   ├───imgs
│   │   │   main.png
│   │   │   
│   │   ├───home
│   │   │       eos.png
│   │   │       hero.png
│   │   │       home-mobile.svg
│   │   │       home.svg
│   │   │       insta-icon.svg
│   │   │       mail-icon.svg
│   │   │       
│   │   └───nav
│   │           nav.svg
│   │           
│   └───js
│           custom-cursor.js
│           post-enhance.js
│           
├───_data
│       site.js
│       
└───_includes
    ├───layouts
    │       base.njk
    │       post.njk
    │       
    └───partials
            nav-links.njk
            nav-primary.njk
```
  
  
---
  


## adding post:

template:

```
---
title: lorem ipsum
date: 20xx-xx-xx
description: lorem ipsum
excerpt: lorem ipsum
tags: 
- lorem
- ipsum
---

{ content }
```


