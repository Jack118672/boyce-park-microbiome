# Group Alpha | Boyce Park Microbiome Project

Static website for the Group Alpha "Who Lives There?" taxonomic analysis project.

The site is scoped only to the Boyce Park pond-water assignment. It helps the team organize the required work:

- Rank abundant representative sequences from `feature-table.tsv`
- BLAST top sequences from `dna-sequences.fasta`
- Compare BLAST calls against `taxonomy.tsv`
- Check blank and distilled-water controls before trusting taxa
- Build a major-taxa composition profile
- Write notes for the two required PCoA views
- Include "Going Farther" work such as PICRUSt or PERMANOVA/ANOSIM when time allows
- Export a notebook outline for Colab

## Run Locally

Open `index.html` directly in a browser, or serve the folder with any static server.

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish With GitHub Pages

After pushing this repository to GitHub:

1. Open the repository settings.
2. Go to Pages.
3. Set the source to the main branch and root folder.
4. Save, then open the Pages URL GitHub provides.

The app has no build step and no external dependencies.

## Data Reminder

The example data in the interface is only placeholder data for practicing the workflow. Replace it with the real Group Alpha Boyce Park results before submitting the Colab notebook.
