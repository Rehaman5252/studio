
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import html2canvas from 'html2canvas';
import jspdf from 'jspdf';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(time: number): string {
  return time.toString().padStart(2, '0');
}

/**
 * Generates a unique ID for the current 10-minute quiz slot.
 * @returns A string representing the start time of the current slot.
 */
export const getQuizSlotId = () => {
  const now = new Date();
  const minutes = now.getMinutes();
  const slotLength = 10; // 10 minutes per slot
  const currentSlotStartMinute = Math.floor(minutes / slotLength) * slotLength;
  
  const slotTime = new Date(now);
  slotTime.setMinutes(currentSlotStartMinute, 0, 0); // Set to the beginning of the slot
  
  return slotTime.getTime().toString();
};


/**
 * Captures an HTML element and downloads it as a high-quality PDF.
 * @param elementId The ID of the HTML element to capture.
 * @param userName The name of the user for the filename.
 * @param format The quiz format for the filename.
 */
export const downloadCertificate = (elementId: string, userName: string, format: string) => {
  const input = document.getElementById(elementId);
  if (!input) {
    console.error("Certificate element not found!");
    alert("Could not find certificate element to download.");
    return;
  }

  // Use html2canvas to render the div as a canvas
  html2canvas(input, { 
    scale: 2.5, // Increase scale for higher resolution
    useCORS: true,
    backgroundColor: null, // Transparent background to respect the element's style
    logging: false,
  }).then(canvas => {
    try {
      const imgData = canvas.toDataURL('image/png');
      
      // Use jsPDF to create a PDF from the canvas image
      const pdf = new jspdf({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      
      const safeUserName = userName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      pdf.save(`indcric_certificate_${safeUserName}_${format}.pdf`);
    } catch (e) {
        console.error("Error generating PDF:", e);
        alert("An error occurred while trying to generate the certificate PDF.");
    }
  }).catch(err => {
      console.error("Error with html2canvas:", err);
      alert("An error occurred while capturing the certificate image.");
  });
};
