# DeepSlick-AIS Datasets

This project utilizes the following data sources for development and demonstration in accordance with the project requirements:

## 1. AIS (Automatic Identification System) Data
- **Format Reference**: The data schema follows the official sample AIS data format provided by the [Marine Cadastre](https://marinecadastre.gov/accessais/).
- **Current Usage (Synthetic)**: For demonstration purposes and to ensure reliable simulation of the correlation algorithm, we generate synthetic AIS data tailored to the specific region of the detected oil spill. This is handled by our `backend/scripts/generate_fixtures.py` script.
- **Future Integration (Real Data)**: The pipeline is built to ingest real historical AIS CSV logs whenever available for live deployment.

## 2. Satellite Imagery Data
- **Source**: [Zenodo - Sentinel-1 SAR Oil Spill Dataset](https://zenodo.org/)
- **Usage**: This dataset provides Ground Range Detected (GRD) Sentinel-1 Synthetic Aperture Radar (SAR) imagery. It is intended to be used for training and validating the semantic segmentation model (U-Net / SegFormer) for automated slick detection and look-alike suppression.
