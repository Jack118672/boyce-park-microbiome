# Group Alpha | Boyce Park Microbiome Project

Static presentation website for the Group Alpha "Who Lives There?" taxonomic analysis project.

The site is scoped only to the Boyce Park pond-water assignment. It is designed to read like a student presentation while still covering the required evidence:

- Rank abundant representative sequences from `feature-table.tsv`
- BLAST top sequences from `dna-sequences.fasta`
- Compare BLAST calls against `taxonomy.tsv`
- Check blank and distilled-water controls before trusting taxa
- Build a major-taxa composition profile
- Show two PCoA views using the Boyce Park and shared water-site tables
- Include "Going Farther" work such as PICRUSt or PERMANOVA/ANOSIM when time allows

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

## Data Used

The "Load Boyce evidence" button uses the 20 most abundant Boyce Park features from the feature table, plus BLAST percent-identity notes from the result screenshots. The composition chart uses the full Boyce Park feature table, not only the top 20 rows. The PCoA plots were computed from the shared water feature table, with Boyce Park compared against the river-baseline samples and then against Boyce Park sub-locations.

Audit values used on the page: 5,818 Boyce features in `dna-sequences.fasta`, 882,619 Boyce reads in the parsed feature table, 56.5% Proteobacteria, 18.8% Cyanobacteria/chloroplast, and 14.3% Actinobacteriota. The shared-water PCoA uses 11 Boyce points, 15 river-baseline points, and 2 controls.
