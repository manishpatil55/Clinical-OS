# from xhtml2pdf import pisa  <-- REMOVED to prevent crash
from io import BytesIO

def create_prescription_pdf(prescription, tenant, patient, doctor, settings):
    """
    DEPRECATED: Server-side PDF generation is disabled due to 'xhtml2pdf' dependency issues on Mac.
    We are moving to Client-side PDF generation (Frontend).
    
    This function is kept as a stub to avoid import errors in main.py until fully refactored.
    """
    print("WARNING: Server-side PDF generation is disabled. Please use Frontend printing.")
    return b"%PDF-1.4 Mock PDF"
