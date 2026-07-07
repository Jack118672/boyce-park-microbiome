# Alpha Submission Checklist

- Use the Boyce Park (A-lphas) data folder.
- Rank roughly 20 abundant sequence variants from `feature-table.tsv`.
- Copy those representative sequences from `dna-sequences.fasta`.
- Run BLAST for each top sequence.
- Compare each BLAST call against `taxonomy.tsv`.
- Check distilled-water and blank controls before trusting a taxon.
- Build a community profile from the taxonomy table or `taxa_barplot.qzv`.
- Make one PCoA comparing Boyce Park samples with the shared river baseline.
- Make a second PCoA showing structure inside the Alpha data.
- Write the biological story: what lives there, what it does, and whether the profile suggests pond water, mine drainage influence, or both.
- If time allows, include "Going Farther" work: PICRUSt function prediction, PERMANOVA/ANOSIM, or indicator organisms.
- Put the write-up and figures into a shared Colab notebook.
