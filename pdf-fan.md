# PDF Fan - Guide technique

## Principe de l'éventail

Les images sont disposées en éventail grâce à une rotation CSS calculée avec la formule :

```css
transform: rotate(calc((var(--i) - 2.5) * 10deg));
```

Le centre de l'éventail est à `--i: 2.5`. Chaque incrément de 1 ajoute 10 degrés de rotation.

## Règle de centrage selon le nombre d'images

| Nb images | Valeurs `--i` à utiliser | Rotations obtenues |
|-----------|--------------------------|-------------------|
| 6 | 0, 1, 2, 3, 4, 5 | -25°, -15°, -5°, +5°, +15°, +25° |
| 5 | 0.5, 1.5, 2.5, 3.5, 4.5 | -20°, -10°, 0°, +10°, +20° |
| 4 | 1, 2, 3, 4 | -15°, -5°, +5°, +15° |
| 3 | 1.5, 2.5, 3.5 | -10°, 0°, +10° |
| 2 | 2, 3 | -5°, +5° |
| 1 | 2.5 | 0° (vertical) |

## Exemple HTML

```html
<!-- 4 images -->
<div class="pdf-fan">
    <img class="pdf-page" src="images/pedagogie/img1.png" alt="..." style="--i: 1;">
    <img class="pdf-page" src="images/pedagogie/img2.png" alt="..." style="--i: 2;">
    <img class="pdf-page" src="images/pedagogie/img3.png" alt="..." style="--i: 3;">
    <img class="pdf-page" src="images/pedagogie/img4.png" alt="..." style="--i: 4;">
</div>
```

---

## Création des miniatures PDF

Les miniatures sont générées à partir des PDFs avec **PyMuPDF** (module `fitz`).

### Installation

```bash
pip install PyMuPDF
```

### Script de conversion

```python
import fitz
import os

ressources_dir = 'ressources'
images_dir = 'images/pedagogie'

os.makedirs(images_dir, exist_ok=True)

pdfs = ['fichier1.pdf', 'fichier2.pdf']  # Liste des PDFs à convertir

for pdf_name in pdfs:
    pdf_path = os.path.join(ressources_dir, pdf_name)
    if os.path.exists(pdf_path):
        doc = fitz.open(pdf_path)
        page = doc[0]  # Première page uniquement
        mat = fitz.Matrix(2, 2)  # Facteur de zoom (2x pour bonne qualité)
        pix = page.get_pixmap(matrix=mat)
        img_name = pdf_name.replace('.pdf', '.png')
        img_path = os.path.join(images_dir, img_name)
        pix.save(img_path)
        print(f'Created: {img_name}')
        doc.close()
```

### Paramètres

- `fitz.Matrix(2, 2)` : facteur de zoom. Augmenter pour plus de résolution.
- `doc[0]` : index de la page (0 = première page).
- Format de sortie : PNG (supporte la transparence).
