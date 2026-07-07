/*
  Marketing Templates Builder — 7 Days Creation
  Logic for Drag & Drop Email Workspace & WhatsApp cellular simulator
*/

(function () {
  'use strict';

  // =============================================
  // DETECT PAGE TYPE
  // =============================================
  const isEmailTemplate = document.getElementById('previewSubjectLabel') !== null;
  const isWhatsappTemplate = document.getElementById('waMsgText') !== null;

  // =============================================
  // DOM ELEMENTS
  // =============================================
  const campaignForm = document.getElementById('campaignForm');
  const sendBtn = document.getElementById('sendBtn');
  const toastMessage = document.getElementById('toastMessage');

  // Fields common
  const campName = document.getElementById('campName');
  const campAudience = document.getElementById('campAudience');
  const campBody = document.getElementById('campBody'); // Textarea for WA

  // Email specific Elements
  const campSubject = document.getElementById('campSubject');
  const previewSubjectLabel = document.getElementById('previewSubjectLabel');
  const emailDropzone = document.getElementById('emailDropzone');
  const blockCustomizer = document.getElementById('blockCustomizer');
  const customizerFields = document.getElementById('customizerFields');
  const closeCustomizer = document.getElementById('closeCustomizer');

  // WhatsApp specific Elements
  const campMedia = document.getElementById('campMedia');
  const waMsgText = document.getElementById('waMsgText');
  const waMediaPreview = document.getElementById('waMediaPreview');
  const waMediaImage = document.getElementById('waMediaImage');
  const waMsgBubble = document.getElementById('waMsgBubble');

  let selectedItem = null;

  // =============================================
  // TOAST SYSTEM
  // =============================================
  function showToast(message) {
    if (!toastMessage) return;
    toastMessage.textContent = message;
    toastMessage.className = 'save-toast active';
    setTimeout(() => {
      toastMessage.className = 'save-toast';
    }, 3000);
  }

  // =============================================
  // WHATSAPP TEMPLATES MOCK PRESETS
  // =============================================
  const waTemplates = {
    launch: "Hello {Name}! 👋\n\nExciting news from 7 Days Creation! We are offering a private booking slot for our newest project: Signature Towers.\n\nReserve your appointment this week and enjoy exclusive pre-launch pricing. Click here to confirm: https://7dayscreation.com/tours",
    followup: "Hi {Name},\n\nThis is Rajesh from 7 Days Creation. Thank you for your inquiry about Creation Residency.\n\nWould you like to schedule a site tour this Thursday or Friday? Let me know! 🏢",
    promo: "Great news {Name}! 💥\n\nFor the next 48 hours, booking a 3BHK villa at Greenfield Villa comes with a free luxury kitchen upgrade package.\n\nReply 'INFO' to receive the brochure directly!"
  };

  // =============================================
  // WHATSAPP PREVIEW SYNC
  // =============================================
  if (isWhatsappTemplate && campBody) {
    campBody.addEventListener('input', function () {
      const parsedText = this.value.replace(/{Name}/g, 'Amit').replace(/{Surname}/g, 'Patel');
      if (waMsgText) {
        waMsgText.innerHTML = (parsedText || 'Message content preview...').replace(/\n/g, '<br>');
      }
    });
    // Trigger initial input event on load
    campBody.dispatchEvent(new Event('input'));
  }

  // WhatsApp Template select trigger and Media Attachment handling
  if (isWhatsappTemplate) {
    const templateRadios = document.querySelectorAll('input[name="campTemplate"]');
    templateRadios.forEach(radio => {
      radio.addEventListener('change', function () {
        document.querySelectorAll('.tmpl-radio').forEach(lbl => {
          if (lbl.querySelector('input[name="campTemplate"]')) {
            lbl.classList.remove('active');
          }
        });
        this.closest('.tmpl-radio').classList.add('active');

        const val = this.value;
        if (waTemplates[val] && campBody) {
          campBody.value = waTemplates[val];
          campBody.dispatchEvent(new Event('input'));
        }
      });
    });

    // WhatsApp Media Selector Logic
    const mediaRadios = document.querySelectorAll('input[name="campMediaType"]');
    const mediaInputsContainer = document.getElementById('mediaInputsContainer');
    const mediaUrlLabel = document.getElementById('mediaUrlLabel');
    const btnUploadWaMedia = document.getElementById('btnUploadWaMedia');
    const waMediaFile = document.getElementById('waMediaFile');
    const waMediaFileName = document.getElementById('waMediaFileName');

    const waMediaVideoContainer = document.getElementById('waMediaVideoContainer');
    const waMediaVideo = document.getElementById('waMediaVideo');
    const waMediaDocContainer = document.getElementById('waMediaDocContainer');
    const waMediaDocName = document.getElementById('waMediaDocName');
    const waMediaDocSize = document.getElementById('waMediaDocSize');

    let uploadedMediaBase64 = '';
    let uploadedMediaName = '';
    let uploadedMediaSize = '';

    function syncWaMediaPreview() {
      const activeRadio = document.querySelector('input[name="campMediaType"]:checked');
      if (!activeRadio) return;

      const mediaType = activeRadio.value;

      // Update active state class on media tabs
      mediaRadios.forEach(radio => {
        const label = radio.closest('.tmpl-radio');
        if (label) label.classList.remove('active');
      });
      const activeLabel = activeRadio.closest('.tmpl-radio');
      if (activeLabel) activeLabel.classList.add('active');

      // Reset preview components
      waMediaPreview.style.display = 'none';
      if (waMediaImage) waMediaImage.style.display = 'none';
      if (waMediaVideoContainer) waMediaVideoContainer.style.display = 'none';
      if (waMediaDocContainer) waMediaDocContainer.style.display = 'none';

      if (mediaType === 'none') {
        if (mediaInputsContainer) mediaInputsContainer.style.display = 'none';
        return;
      }

      // Show container
      if (mediaInputsContainer) mediaInputsContainer.style.display = 'block';

      // Update Labels
      if (mediaUrlLabel) {
        if (mediaType === 'image') mediaUrlLabel.textContent = 'Image Attachment URL';
        if (mediaType === 'video') mediaUrlLabel.textContent = 'Video Link URL (Direct .mp4)';
        if (mediaType === 'document') mediaUrlLabel.textContent = 'Document URL (Direct .pdf)';
      }

      // Update File input accept filter
      if (waMediaFile) {
        if (mediaType === 'image') waMediaFile.accept = 'image/*';
        if (mediaType === 'video') waMediaFile.accept = 'video/*';
        if (mediaType === 'document') waMediaFile.accept = 'application/pdf';
      }

      const mediaUrl = campMedia ? campMedia.value.trim() : '';
      const hasUrl = mediaUrl && mediaUrl !== '(Uploaded File)';
      const hasUpload = uploadedMediaBase64 && campMedia && campMedia.value === '(Uploaded File)';

      if (!hasUrl && !hasUpload) {
        return;
      }

      const activeSource = hasUpload ? uploadedMediaBase64 : mediaUrl;

      waMediaPreview.style.display = 'block';

      if (mediaType === 'image') {
        if (waMediaImage) {
          waMediaImage.style.display = 'block';
          waMediaImage.src = activeSource;
        }
      } else if (mediaType === 'video') {
        if (waMediaVideoContainer && waMediaVideo) {
          waMediaVideoContainer.style.display = 'block';
          waMediaVideo.src = activeSource;
        }
      } else if (mediaType === 'document') {
        if (waMediaDocContainer && waMediaDocName && waMediaDocSize) {
          waMediaDocContainer.style.display = 'flex';
          
          let docName = 'brochure.pdf';
          let docSize = '1.5 MB';

          if (hasUpload) {
            docName = uploadedMediaName || 'uploaded_file.pdf';
            docSize = uploadedMediaSize || '1.0 MB';
          } else {
            try {
              const urlObj = new URL(mediaUrl);
              const pathParts = urlObj.pathname.split('/');
              const filePart = pathParts[pathParts.length - 1];
              if (filePart) {
                docName = filePart;
              }
            } catch (err) {
              if (mediaUrl.lastIndexOf('/') !== -1) {
                docName = mediaUrl.substring(mediaUrl.lastIndexOf('/') + 1);
              } else {
                docName = mediaUrl;
              }
            }
          }
          waMediaDocName.textContent = docName;
          waMediaDocSize.textContent = `${docSize} • PDF`;
        }
      }
    }

    // Trigger tab changes
    mediaRadios.forEach(radio => {
      radio.addEventListener('change', function () {
        uploadedMediaBase64 = '';
        uploadedMediaName = '';
        uploadedMediaSize = '';
        if (waMediaFileName) waMediaFileName.textContent = '';
        if (campMedia) campMedia.value = '';
        syncWaMediaPreview();
      });
    });

    // URL input listener
    if (campMedia) {
      campMedia.addEventListener('input', function () {
        if (this.value !== '(Uploaded File)') {
          uploadedMediaBase64 = '';
          uploadedMediaName = '';
          uploadedMediaSize = '';
          if (waMediaFileName) waMediaFileName.textContent = '';
        }
        syncWaMediaPreview();
      });
    }

    // Upload triggers
    if (btnUploadWaMedia && waMediaFile) {
      btnUploadWaMedia.addEventListener('click', () => waMediaFile.click());
      waMediaFile.addEventListener('change', function () {
        if (this.files && this.files[0]) {
          const file = this.files[0];
          uploadedMediaName = file.name;
          
          const sizeKb = file.size / 1024;
          if (sizeKb > 1024) {
            uploadedMediaSize = (sizeKb / 1024).toFixed(1) + ' MB';
          } else {
            uploadedMediaSize = sizeKb.toFixed(0) + ' KB';
          }

          if (waMediaFileName) {
            waMediaFileName.textContent = file.name + ' (' + uploadedMediaSize + ')';
          }

          const reader = new FileReader();
          reader.onload = function (e) {
            uploadedMediaBase64 = e.target.result;
            if (campMedia) {
              campMedia.value = '(Uploaded File)';
            }
            syncWaMediaPreview();
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }

  // =============================================
  // EMAIL DRAG & DROP DESIGNER LOGIC
  // =============================================
  if (isEmailTemplate && emailDropzone) {
    
    // Sync Subject Line
    if (campSubject && previewSubjectLabel) {
      campSubject.addEventListener('input', function () {
        previewSubjectLabel.textContent = this.value || '(No Subject)';
      });
    }

    // A. Handle Selection state & sidebar customizer trigger

    function selectBlock(item) {
      deselectAllBlocks();
      selectedItem = item;
      item.classList.add('selected');
      renderCustomizer(item);
    }

    function deselectAllBlocks() {
      if (selectedItem) {
        selectedItem.classList.remove('selected');
      }
      selectedItem = null;
      if (blockCustomizer) {
        blockCustomizer.style.display = 'none';
      }
    }

    if (closeCustomizer) {
      closeCustomizer.addEventListener('click', deselectAllBlocks);
    }

    // Helper to convert rgb color string to Hex color string
    function rgbToHex(rgb) {
      if (!rgb) return '';
      if (rgb.startsWith('#')) return rgb;
      const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
      if (!match) return rgb;
      return "#" + ((1 << 24) + (parseInt(match[1]) << 16) + (parseInt(match[2]) << 8) + parseInt(match[3])).toString(16).slice(1);
    }

    // B. Render dynamic controls on sidebar customizer panel
    function renderCustomizer(item) {
      if (!blockCustomizer || !customizerFields) return;
      blockCustomizer.style.display = 'block';
      customizerFields.innerHTML = '';

      const type = item.getAttribute('data-type');

      if (type === 'header') {
        const headerBlock = item.querySelector('.builder-header-block');
        const titleEl = item.querySelector('.header-title');
        const subtitleEl = item.querySelector('.header-subtitle');
        const imgEl = item.querySelector('img');
        const linkEl = item.querySelector('.builder-header-block a');
        
        const titleVal = titleEl ? titleEl.textContent : '';
        const subtitleVal = subtitleEl ? subtitleEl.textContent : '';
        const logoSrc = imgEl ? imgEl.getAttribute('src') || '' : '';
        const logoHeight = imgEl ? imgEl.style.height || '32px' : '32px';
        const logoLinkVal = linkEl ? linkEl.getAttribute('href') || '' : '';
        const alignVal = headerBlock ? headerBlock.style.textAlign || 'center' : 'center';
        
        const bgColor = rgbToHex(headerBlock ? headerBlock.style.backgroundColor : '') || '#ffffff';
        const borderColor = rgbToHex(headerBlock ? headerBlock.style.borderBottomColor : '') || '#f05a28';
        const borderWidth = parseInt(headerBlock ? headerBlock.style.borderBottomWidth : '') || 3;
        
        const titleColor = rgbToHex(titleEl ? titleEl.style.color : '') || '#000000';
        const subColor = rgbToHex(subtitleEl ? subtitleEl.style.color : '') || '#f05a28';

        customizerFields.innerHTML = `
          <div class="customizer-group">
            <label>Header Title</label>
            <input type="text" class="customizer-input" id="cHeaderTitle" value="${titleVal}">
          </div>
          <div class="customizer-group">
            <label>Title Color</label>
            <input type="color" class="customizer-input" id="cHeaderTitleColor" value="${titleColor}">
          </div>
          <div class="customizer-group">
            <label>Header Subtitle</label>
            <input type="text" class="customizer-input" id="cHeaderSubtitle" value="${subtitleVal}">
          </div>
          <div class="customizer-group">
            <label>Subtitle Color</label>
            <input type="color" class="customizer-input" id="cHeaderSubColor" value="${subColor}">
          </div>
          <div class="customizer-group">
            <label>Logo Image URL</label>
            <input type="text" class="customizer-input" id="cHeaderLogoSrc" value="${logoSrc}">
          </div>
          <div class="customizer-group">
            <label>Logo Link URL</label>
            <input type="text" class="customizer-input" id="cHeaderLogoLink" value="${logoLinkVal}" placeholder="e.g. https://website.com">
          </div>
          <div class="customizer-group">
            <label>Upload Logo</label>
            <button type="button" class="btn-save-tmpl" id="btnUploadHeaderLogo" style="margin-bottom:6px; background:#000; color:#fff; border:none; padding:8px; border-radius:4px; font-weight:600; cursor:pointer;">Choose Image File...</button>
            <input type="file" id="cHeaderLogoFile" accept="image/*" style="display:none;">
          </div>
          <div class="customizer-group">
            <label>Logo Height</label>
            <input type="text" class="customizer-input" id="cHeaderLogoHeight" value="${logoHeight}" placeholder="e.g. 32px">
          </div>
          <div class="customizer-group">
            <label>Background Color</label>
            <input type="color" class="customizer-input" id="cHeaderBg" value="${bgColor}">
          </div>
          <div class="customizer-group">
            <label>Bottom Line Color</label>
            <input type="color" class="customizer-input" id="cHeaderBorderColor" value="${borderColor}">
          </div>
          <div class="customizer-group">
            <label>Bottom Line Thickness (px)</label>
            <input type="range" class="customizer-input" id="cHeaderBorderWidth" min="0" max="10" value="${borderWidth}">
          </div>
          <div class="customizer-group">
            <label>Alignment</label>
            <select class="customizer-select" id="cHeaderAlign">
              <option value="left" ${alignVal === 'left' ? 'selected' : ''}>Left</option>
              <option value="center" ${alignVal === 'center' || alignVal === '' ? 'selected' : ''}>Center</option>
              <option value="right" ${alignVal === 'right' ? 'selected' : ''}>Right</option>
            </select>
          </div>
        `;

        document.getElementById('cHeaderTitle').addEventListener('input', function () {
          if (titleEl) titleEl.textContent = this.value;
        });
        document.getElementById('cHeaderTitleColor').addEventListener('input', function () {
          if (titleEl) titleEl.style.color = this.value;
        });
        document.getElementById('cHeaderSubtitle').addEventListener('input', function () {
          if (subtitleEl) {
            subtitleEl.textContent = this.value;
          } else if (this.value && headerBlock) {
            const sub = document.createElement('div');
            sub.className = 'header-subtitle';
            sub.style.fontSize = '11px';
            sub.style.fontWeight = '600';
            sub.style.textTransform = 'uppercase';
            sub.style.color = '#f05a28';
            sub.style.letterSpacing = '1px';
            sub.style.marginTop = '4px';
            sub.textContent = this.value;
            headerBlock.appendChild(sub);
          }
        });
        document.getElementById('cHeaderSubColor').addEventListener('input', function () {
          const subEl = item.querySelector('.header-subtitle');
          if (subEl) subEl.style.color = this.value;
        });
        document.getElementById('cHeaderLogoSrc').addEventListener('input', function () {
          if (imgEl) imgEl.setAttribute('src', this.value || 'images/logo.png');
        });
        document.getElementById('cHeaderLogoLink').addEventListener('input', function () {
          const linkEl = item.querySelector('.builder-header-block a');
          if (linkEl) linkEl.setAttribute('href', this.value || '#');
        });
        const fileInputLogo = document.getElementById('cHeaderLogoFile');
        const uploadBtnLogo = document.getElementById('btnUploadHeaderLogo');
        uploadBtnLogo.addEventListener('click', () => fileInputLogo.click());
        fileInputLogo.addEventListener('change', function() {
          if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
              if (imgEl) imgEl.setAttribute('src', e.target.result);
              const srcInput = document.getElementById('cHeaderLogoSrc');
              if (srcInput) srcInput.value = '(Uploaded File)';
            };
            reader.readAsDataURL(this.files[0]);
          }
        });
        document.getElementById('cHeaderLogoHeight').addEventListener('input', function () {
          if (imgEl) {
            imgEl.style.height = this.value || '32px';
            imgEl.style.height = this.value.includes('px') ? this.value : this.value + 'px';
          }
        });
        document.getElementById('cHeaderBg').addEventListener('input', function () {
          if (headerBlock) headerBlock.style.backgroundColor = this.value;
        });
        document.getElementById('cHeaderBorderColor').addEventListener('input', function () {
          if (headerBlock) headerBlock.style.borderBottomColor = this.value;
        });
        document.getElementById('cHeaderBorderWidth').addEventListener('input', function () {
          if (headerBlock) headerBlock.style.borderBottomWidth = this.value + 'px';
          if (headerBlock && !headerBlock.style.borderBottomStyle) {
            headerBlock.style.borderBottomStyle = 'solid';
          }
        });
        document.getElementById('cHeaderAlign').addEventListener('change', function () {
          if (headerBlock) {
            headerBlock.style.textAlign = this.value;
            if (imgEl) {
              const linkWrapper = item.querySelector('.builder-header-block a');
              const target = linkWrapper || imgEl;
              target.style.marginLeft = this.value === 'center' ? 'auto' : (this.value === 'right' ? 'auto' : '0');
              target.style.marginRight = this.value === 'center' ? 'auto' : (this.value === 'right' ? '0' : 'auto');
            }
          }
        });

      } else if (type === 'text') {
        const textBlock = item.querySelector('.builder-text-block');
        const alignVal = textBlock ? textBlock.style.textAlign || 'left' : 'left';
        const sizeVal = textBlock ? textBlock.style.fontSize || '13px' : '13px';
        const rawContent = textBlock ? textBlock.innerHTML.trim().replace(/<br\s*\/?>/mg, "\n") : '';

        customizerFields.innerHTML = `
          <div class="customizer-group">
            <label>Text Content</label>
            <textarea class="customizer-input" id="cTextContent" rows="6">${rawContent}</textarea>
          </div>
          <div class="customizer-group">
            <label>Text Alignment</label>
            <select class="customizer-select" id="cTextAlign">
              <option value="left" ${alignVal === 'left' ? 'selected' : ''}>Left</option>
              <option value="center" ${alignVal === 'center' ? 'selected' : ''}>Center</option>
              <option value="right" ${alignVal === 'right' ? 'selected' : ''}>Right</option>
            </select>
          </div>
          <div class="customizer-group">
            <label>Font Size</label>
            <select class="customizer-select" id="cTextSize">
              <option value="11px" ${sizeVal === '11px' ? 'selected' : ''}>Small (11px)</option>
              <option value="13px" ${sizeVal === '13px' ? 'selected' : ''}>Normal (13px)</option>
              <option value="16px" ${sizeVal === '16px' ? 'selected' : ''}>Medium (16px)</option>
              <option value="18px" ${sizeVal === '18px' ? 'selected' : ''}>Large (18px)</option>
            </select>
          </div>
        `;

        const textarea = document.getElementById('cTextContent');
        textarea.addEventListener('input', function () {
          if (textBlock) textBlock.innerHTML = this.value.replace(/\n/g, '<br>');
        });

        textBlock.addEventListener('input', function () {
          textarea.value = this.innerHTML.replace(/<br\s*\/?>/mg, "\n");
        });

        document.getElementById('cTextAlign').addEventListener('change', function () {
          if (textBlock) textBlock.style.textAlign = this.value;
        });

        document.getElementById('cTextSize').addEventListener('change', function () {
          if (textBlock) textBlock.style.fontSize = this.value;
        });

      } else if (type === 'image') {
        const imgEl = item.querySelector('img');
        let linkEl = item.querySelector('.builder-image-block a');
        if (!linkEl && imgEl) {
          linkEl = document.createElement('a');
          linkEl.setAttribute('href', '#');
          linkEl.setAttribute('onclick', 'return false;');
          imgEl.parentNode.insertBefore(linkEl, imgEl);
          linkEl.appendChild(imgEl);
        }
        const srcVal = imgEl ? imgEl.getAttribute('src') || '' : '';
        const widthVal = imgEl ? imgEl.style.maxWidth || '100%' : '100%';
        const linkVal = linkEl ? linkEl.getAttribute('href') || '' : '';
        const alignVal = item.querySelector('.builder-image-block')?.style.textAlign || 'center';

        customizerFields.innerHTML = `
          <div class="customizer-group">
            <label>Image URL</label>
            <input type="text" class="customizer-input" id="cImgSrc" value="${srcVal}">
          </div>
          <div class="customizer-group">
            <label>Link URL</label>
            <input type="text" class="customizer-input" id="cImgLink" value="${linkVal}" placeholder="e.g. https://website.com">
          </div>
          <div class="customizer-group">
            <label>Upload Image</label>
            <button type="button" class="btn-save-tmpl" id="btnUploadImg" style="margin-bottom:6px; background:#000; color:#fff; border:none; padding:8px; border-radius:4px; font-weight:600; cursor:pointer;">Choose Image File...</button>
            <input type="file" id="cImgFile" accept="image/*" style="display:none;">
          </div>
          <div class="customizer-group">
            <label>Max Width</label>
            <input type="text" class="customizer-input" id="cImgWidth" value="${widthVal}" placeholder="e.g. 100% or 300px">
          </div>
          <div class="customizer-group">
            <label>Image Alignment</label>
            <select class="customizer-select" id="cImgAlign">
              <option value="left" ${alignVal === 'left' ? 'selected' : ''}>Left</option>
              <option value="center" ${alignVal === 'center' || alignVal === '' ? 'selected' : ''}>Center</option>
              <option value="right" ${alignVal === 'right' ? 'selected' : ''}>Right</option>
            </select>
          </div>
        `;

        document.getElementById('cImgSrc').addEventListener('input', function () {
          if (imgEl) imgEl.setAttribute('src', this.value || 'images/logo.png');
        });

        document.getElementById('cImgLink').addEventListener('input', function () {
          if (linkEl) linkEl.setAttribute('href', this.value || '#');
        });

        const fileInputImg = document.getElementById('cImgFile');
        const uploadBtnImg = document.getElementById('btnUploadImg');
        uploadBtnImg.addEventListener('click', () => fileInputImg.click());
        fileInputImg.addEventListener('change', function() {
          if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
              if (imgEl) imgEl.setAttribute('src', e.target.result);
              const srcInput = document.getElementById('cImgSrc');
              if (srcInput) srcInput.value = '(Uploaded File)';
            };
            reader.readAsDataURL(this.files[0]);
          }
        });

        document.getElementById('cImgWidth').addEventListener('input', function () {
          if (imgEl) imgEl.style.maxWidth = this.value || '100%';
        });

        document.getElementById('cImgAlign').addEventListener('change', function () {
          const imgBlock = item.querySelector('.builder-image-block');
          if (imgBlock) imgBlock.style.textAlign = this.value;
        });

      } else if (type === 'columns-left-img' || type === 'columns-right-img') {
        const imgEl = item.querySelector('img');
        const pEl = item.querySelector('.builder-column-half p');
        const srcVal = imgEl ? imgEl.getAttribute('src') || '' : '';
        const textVal = pEl ? pEl.innerHTML.trim().replace(/<br\s*\/?>/mg, "\n") : '';
        const alignVal = pEl ? pEl.style.textAlign || 'left' : 'left';

        customizerFields.innerHTML = `
          <div class="customizer-group">
            <label>Image URL</label>
            <input type="text" class="customizer-input" id="cColImgSrc" value="${srcVal}">
          </div>
          <div class="customizer-group">
            <label>Upload Image</label>
            <button type="button" class="btn-save-tmpl" id="btnUploadColImg" style="margin-bottom:6px; background:#000; color:#fff; border:none; padding:8px; border-radius:4px; font-weight:600; cursor:pointer;">Choose Image File...</button>
            <input type="file" id="cColImgFile" accept="image/*" style="display:none;">
          </div>
          <div class="customizer-group">
            <label>Text Content</label>
            <textarea class="customizer-input" id="cColText" rows="4">${textVal}</textarea>
          </div>
          <div class="customizer-group">
            <label>Text Alignment</label>
            <select class="customizer-select" id="cColAlign">
              <option value="left" ${alignVal === 'left' ? 'selected' : ''}>Left</option>
              <option value="center" ${alignVal === 'center' ? 'selected' : ''}>Center</option>
              <option value="right" ${alignVal === 'right' ? 'selected' : ''}>Right</option>
            </select>
          </div>
        `;

        document.getElementById('cColImgSrc').addEventListener('input', function () {
          if (imgEl) imgEl.setAttribute('src', this.value || 'images/logo.png');
        });

        const fileInputCol = document.getElementById('cColImgFile');
        const uploadBtnCol = document.getElementById('btnUploadColImg');
        uploadBtnCol.addEventListener('click', () => fileInputCol.click());
        fileInputCol.addEventListener('change', function() {
          if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
              if (imgEl) imgEl.setAttribute('src', e.target.result);
              const srcInput = document.getElementById('cColImgSrc');
              if (srcInput) srcInput.value = '(Uploaded File)';
            };
            reader.readAsDataURL(this.files[0]);
          }
        });

        document.getElementById('cColText').addEventListener('input', function () {
          if (pEl) pEl.innerHTML = this.value.replace(/\n/g, '<br>');
        });

        document.getElementById('cColAlign').addEventListener('change', function () {
          if (pEl) pEl.style.textAlign = this.value;
        });

      } else if (type === 'spacer') {
        const spacerEl = item.querySelector('.builder-spacer-block');
        const currentHeight = spacerEl ? parseInt(spacerEl.style.height) || 30 : 30;

        customizerFields.innerHTML = `
          <div class="customizer-group">
            <label>Height (px): <span id="spacerHeightLabel">${currentHeight}px</span></label>
            <input type="range" class="customizer-input" id="cSpacerHeight" min="10" max="150" value="${currentHeight}">
          </div>
        `;

        document.getElementById('cSpacerHeight').addEventListener('input', function () {
          if (spacerEl) {
            spacerEl.style.height = this.value + 'px';
            document.getElementById('spacerHeightLabel').textContent = this.value + 'px';
          }
        });

      } else if (type === 'product-card') {
        const imgEl = item.querySelector('img');
        const titleEl = item.querySelector('.builder-product-title');
        const priceEl = item.querySelector('.builder-product-price');
        const btnEl = item.querySelector('.builder-product-btn');
        const containerEl = item.querySelector('.builder-product-block');

        const srcVal = imgEl ? imgEl.getAttribute('src') || '' : '';
        const titleVal = titleEl ? titleEl.textContent : '';
        const priceVal = priceEl ? priceEl.textContent : '';
        const hrefVal = btnEl ? btnEl.getAttribute('href') : '#';
        const btnTextVal = btnEl ? btnEl.textContent : 'Enquire Now';
        const alignVal = containerEl ? containerEl.style.textAlign || 'center' : 'center';

        customizerFields.innerHTML = `
          <div class="customizer-group">
            <label>Product Image URL</label>
            <input type="text" class="customizer-input" id="cProdImg" value="${srcVal}">
          </div>
          <div class="customizer-group">
            <label>Upload Product Image</label>
            <button type="button" class="btn-save-tmpl" id="btnUploadProdImg" style="margin-bottom:6px; background:#000; color:#fff; border:none; padding:8px; border-radius:4px; font-weight:600; cursor:pointer;">Choose Image File...</button>
            <input type="file" id="cProdImgFile" accept="image/*" style="display:none;">
          </div>
          <div class="customizer-group">
            <label>Product Title</label>
            <input type="text" class="customizer-input" id="cProdTitle" value="${titleVal}">
          </div>
          <div class="customizer-group">
            <label>Price</label>
            <input type="text" class="customizer-input" id="cProdPrice" value="${priceVal}">
          </div>
          <div class="customizer-group">
            <label>Button Label</label>
            <input type="text" class="customizer-input" id="cProdBtnText" value="${btnTextVal}">
          </div>
          <div class="customizer-group">
            <label>Button URL</label>
            <input type="text" class="customizer-input" id="cProdHref" value="${hrefVal}">
          </div>
          <div class="customizer-group">
            <label>Card Alignment</label>
            <select class="customizer-select" id="cProdAlign">
              <option value="left" ${alignVal === 'left' ? 'selected' : ''}>Left</option>
              <option value="center" ${alignVal === 'center' || alignVal === '' ? 'selected' : ''}>Center</option>
              <option value="right" ${alignVal === 'right' ? 'selected' : ''}>Right</option>
            </select>
          </div>
        `;

        document.getElementById('cProdImg').addEventListener('input', function () {
          if (imgEl) imgEl.setAttribute('src', this.value || 'images/logo.png');
        });

        const fileInputProd = document.getElementById('cProdImgFile');
        const uploadBtnProd = document.getElementById('btnUploadProdImg');
        uploadBtnProd.addEventListener('click', () => fileInputProd.click());
        fileInputProd.addEventListener('change', function() {
          if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
              if (imgEl) imgEl.setAttribute('src', e.target.result);
              const srcInput = document.getElementById('cProdImg');
              if (srcInput) srcInput.value = '(Uploaded File)';
            };
            reader.readAsDataURL(this.files[0]);
          }
        });

        document.getElementById('cProdTitle').addEventListener('input', function () {
          if (titleEl) titleEl.textContent = this.value;
        });

        document.getElementById('cProdPrice').addEventListener('input', function () {
          if (priceEl) priceEl.textContent = this.value;
        });

        document.getElementById('cProdBtnText').addEventListener('input', function () {
          if (btnEl) btnEl.textContent = this.value;
        });

        document.getElementById('cProdHref').addEventListener('input', function () {
          if (btnEl) btnEl.setAttribute('href', this.value || '#');
        });

        document.getElementById('cProdAlign').addEventListener('change', function () {
          if (containerEl) {
            containerEl.style.textAlign = this.value;
            if (this.value === 'left') {
              containerEl.style.marginLeft = '0';
              containerEl.style.marginRight = 'auto';
            } else if (this.value === 'right') {
              containerEl.style.marginLeft = 'auto';
              containerEl.style.marginRight = '0';
            } else {
              containerEl.style.marginLeft = 'auto';
              containerEl.style.marginRight = 'auto';
            }
          }
        });

      } else if (type === 'button') {
        const btnLink = item.querySelector('a');
        const labelVal = btnLink ? btnLink.textContent : 'Book Now';
        const hrefVal = btnLink ? btnLink.getAttribute('href') : '#';
        const alignVal = item.querySelector('.builder-button-block').style.textAlign || 'center';

        customizerFields.innerHTML = `
          <div class="customizer-group">
            <label>Button Label</label>
            <input type="text" class="customizer-input" id="cBtnLabel" value="${labelVal}">
          </div>
          <div class="customizer-group">
            <label>Link URL</label>
            <input type="text" class="customizer-input" id="cBtnHref" value="${hrefVal}">
          </div>
          <div class="customizer-group">
            <label>Alignment</label>
            <select class="customizer-select" id="cBtnAlign">
              <option value="left" ${alignVal === 'left' ? 'selected' : ''}>Left</option>
              <option value="center" ${alignVal === 'center' || alignVal === '' ? 'selected' : ''}>Center</option>
              <option value="right" ${alignVal === 'right' ? 'selected' : ''}>Right</option>
            </select>
          </div>
        `;

        document.getElementById('cBtnLabel').addEventListener('input', function () {
          if (btnLink) btnLink.textContent = this.value;
        });

        document.getElementById('cBtnHref').addEventListener('input', function () {
          if (btnLink) btnLink.setAttribute('href', this.value || '#');
        });

        document.getElementById('cBtnAlign').addEventListener('change', function () {
          item.querySelector('.builder-button-block').style.textAlign = this.value;
        });

      } else if (type === 'divider') {
        const hrEl = item.querySelector('hr');
        const styleVal = hrEl ? hrEl.style.borderStyle || 'solid' : 'solid';

        customizerFields.innerHTML = `
          <div class="customizer-group">
            <label>Divider Style</label>
            <select class="customizer-select" id="cDivStyle">
              <option value="solid" ${styleVal === 'solid' ? 'selected' : ''}>Solid Line</option>
              <option value="dashed" ${styleVal === 'dashed' ? 'selected' : ''}>Dashed Line</option>
              <option value="dotted" ${styleVal === 'dotted' ? 'selected' : ''}>Dotted Line</option>
            </select>
          </div>
        `;

        document.getElementById('cDivStyle').addEventListener('change', function () {
          if (hrEl) hrEl.style.borderStyle = this.value;
        });
      } else if (type === 'otp-card') {
        const otpBlock = item.querySelector('.builder-otp-block');
        const badgeEl = item.querySelector('.builder-otp-badge');
        const titleEl = item.querySelector('.builder-otp-title');
        const descEl = item.querySelector('.builder-otp-desc');
        const codeEl = item.querySelector('.builder-otp-code-container');

        const badgeText = badgeEl ? badgeEl.textContent : '';
        const titleText = titleEl ? titleEl.textContent : '';
        const descText = descEl ? descEl.innerHTML.replace(/<br\s*\/?>/mg, "\n") : '';
        const codeText = codeEl ? codeEl.textContent : '';

        const badgeBgColor = rgbToHex(badgeEl ? badgeEl.style.backgroundColor : '') || '#f05a28';
        const boxBgColor = rgbToHex(codeEl ? codeEl.style.backgroundColor : '') || '#f9f9f9';
        const boxBorderStyle = codeEl ? codeEl.style.borderStyle || 'dashed' : 'dashed';

        customizerFields.innerHTML = `
          <div class="customizer-group">
            <label>Badge Text</label>
            <input type="text" class="customizer-input" id="cOtpBadgeText" value="${badgeText}">
          </div>
          <div class="customizer-group">
            <label>Badge Background Color</label>
            <input type="color" class="customizer-input" id="cOtpBadgeBg" value="${badgeBgColor}">
          </div>
          <div class="customizer-group">
            <label>Title</label>
            <input type="text" class="customizer-input" id="cOtpTitle" value="${titleText}">
          </div>
          <div class="customizer-group">
            <label>Description Text</label>
            <textarea class="customizer-input" id="cOtpDesc" rows="4">${descText}</textarea>
          </div>
          <div class="customizer-group">
            <label>Verification Code</label>
            <input type="text" class="customizer-input" id="cOtpCode" value="${codeText}">
          </div>
          <div class="customizer-group">
            <label>Code Box Background</label>
            <input type="color" class="customizer-input" id="cOtpBoxBg" value="${boxBgColor}">
          </div>
          <div class="customizer-group">
            <label>Code Box Border Style</label>
            <select class="customizer-select" id="cOtpBoxBorder">
              <option value="dashed" ${boxBorderStyle === 'dashed' ? 'selected' : ''}>Dashed</option>
              <option value="solid" ${boxBorderStyle === 'solid' ? 'selected' : ''}>Solid</option>
              <option value="dotted" ${boxBorderStyle === 'dotted' ? 'selected' : ''}>Dotted</option>
              <option value="none" ${boxBorderStyle === 'none' ? 'selected' : ''}>None</option>
            </select>
          </div>
        `;

        document.getElementById('cOtpBadgeText').addEventListener('input', function () {
          if (badgeEl) badgeEl.textContent = this.value;
        });
        document.getElementById('cOtpBadgeBg').addEventListener('input', function () {
          if (badgeEl) badgeEl.style.backgroundColor = this.value;
        });
        document.getElementById('cOtpTitle').addEventListener('input', function () {
          if (titleEl) titleEl.textContent = this.value;
        });
        document.getElementById('cOtpDesc').addEventListener('input', function () {
          if (descEl) descEl.innerHTML = this.value.replace(/\n/g, '<br>');
        });
        document.getElementById('cOtpCode').addEventListener('input', function () {
          if (codeEl) codeEl.textContent = this.value;
        });
        document.getElementById('cOtpBoxBg').addEventListener('input', function () {
          if (codeEl) codeEl.style.backgroundColor = this.value;
        });
        document.getElementById('cOtpBoxBorder').addEventListener('change', function () {
          if (codeEl) {
            codeEl.style.borderStyle = this.value;
            if (this.value === 'none') {
              codeEl.style.borderWidth = '0';
            } else {
              codeEl.style.borderWidth = '1px';
            }
          }
        });
      } else if (type === 'social') {
        const socialBlock = item.querySelector('.builder-social-block');
        const fbEl = item.querySelector('.social-icon-fb');
        const xEl = item.querySelector('.social-icon-x');
        const igEl = item.querySelector('.social-icon-ig');
        const liEl = item.querySelector('.social-icon-li');
        const ytEl = item.querySelector('.social-icon-yt');

        const fbUrl = fbEl ? fbEl.getAttribute('href') : '#';
        const xUrl = xEl ? xEl.getAttribute('href') : '#';
        const igUrl = igEl ? igEl.getAttribute('href') : '#';
        const liUrl = liEl ? liEl.getAttribute('href') : '#';
        const ytUrl = ytEl ? ytEl.getAttribute('href') : '#';

        const fbShow = fbEl && fbEl.style.display !== 'none';
        const xShow = xEl && xEl.style.display !== 'none';
        const igShow = igEl && igEl.style.display !== 'none';
        const liShow = liEl && liEl.style.display !== 'none';
        const ytShow = ytEl && ytEl.style.display !== 'none';

        const alignVal = socialBlock ? socialBlock.style.textAlign || 'center' : 'center';
        const colorVal = rgbToHex(fbEl ? fbEl.style.color : '') || '#000000';

        customizerFields.innerHTML = `
          <div class="customizer-group">
            <label>Icon Colors</label>
            <input type="color" class="customizer-input" id="cSocialColor" value="${colorVal}">
          </div>
          <div class="customizer-group">
            <label>Facebook URL</label>
            <input type="text" class="customizer-input" id="cSocialFb" value="${fbUrl}">
            <label class="custom-checkbox" style="font-size:11px; margin-top:2px;">
              <input type="checkbox" id="cSocialShowFb" ${fbShow ? 'checked' : ''}> Show Facebook
            </label>
          </div>
          <div class="customizer-group">
            <label>X / Twitter URL</label>
            <input type="text" class="customizer-input" id="cSocialX" value="${xUrl}">
            <label class="custom-checkbox" style="font-size:11px; margin-top:2px;">
              <input type="checkbox" id="cSocialShowX" ${xShow ? 'checked' : ''}> Show X
            </label>
          </div>
          <div class="customizer-group">
            <label>Instagram URL</label>
            <input type="text" class="customizer-input" id="cSocialIg" value="${igUrl}">
            <label class="custom-checkbox" style="font-size:11px; margin-top:2px;">
              <input type="checkbox" id="cSocialShowIg" ${igShow ? 'checked' : ''}> Show Instagram
            </label>
          </div>
          <div class="customizer-group">
            <label>LinkedIn URL</label>
            <input type="text" class="customizer-input" id="cSocialLi" value="${liUrl}">
            <label class="custom-checkbox" style="font-size:11px; margin-top:2px;">
              <input type="checkbox" id="cSocialShowLi" ${liShow ? 'checked' : ''}> Show LinkedIn
            </label>
          </div>
          <div class="customizer-group">
            <label>YouTube URL</label>
            <input type="text" class="customizer-input" id="cSocialYt" value="${ytUrl}">
            <label class="custom-checkbox" style="font-size:11px; margin-top:2px;">
              <input type="checkbox" id="cSocialShowYt" ${ytShow ? 'checked' : ''}> Show YouTube
            </label>
          </div>
          <div class="customizer-group">
            <label>Alignment</label>
            <select class="customizer-select" id="cSocialAlign">
              <option value="left" ${alignVal === 'left' ? 'selected' : ''}>Left</option>
              <option value="center" ${alignVal === 'center' || alignVal === '' ? 'selected' : ''}>Center</option>
              <option value="right" ${alignVal === 'right' ? 'selected' : ''}>Right</option>
            </select>
          </div>
        `;

        document.getElementById('cSocialColor').addEventListener('input', function () {
          item.querySelectorAll('.builder-social-block a').forEach(a => a.style.color = this.value);
        });

        const setupSocialUrlListener = (inputId, el) => {
          document.getElementById(inputId).addEventListener('input', function () {
            if (el) el.setAttribute('href', this.value || '#');
          });
        };
        setupSocialUrlListener('cSocialFb', fbEl);
        setupSocialUrlListener('cSocialX', xEl);
        setupSocialUrlListener('cSocialIg', igEl);
        setupSocialUrlListener('cSocialLi', liEl);
        setupSocialUrlListener('cSocialYt', ytEl);

        const setupSocialShowListener = (checkboxId, el) => {
          document.getElementById(checkboxId).addEventListener('change', function () {
            if (el) el.style.display = this.checked ? 'inline-block' : 'none';
          });
        };
        setupSocialShowListener('cSocialShowFb', fbEl);
        setupSocialShowListener('cSocialShowX', xEl);
        setupSocialShowListener('cSocialShowIg', igEl);
        setupSocialShowListener('cSocialShowLi', liEl);
        setupSocialShowListener('cSocialShowYt', ytEl);

        document.getElementById('cSocialAlign').addEventListener('change', function () {
          if (socialBlock) socialBlock.style.textAlign = this.value;
        });
      } else if (type === 'callout') {
        const wrapperEl = item.querySelector('.builder-callout-wrapper');
        const textVal = wrapperEl ? wrapperEl.innerHTML.trim().replace(/<br\s*\/?>/mg, "\n") : '';
        const borderVal = rgbToHex(wrapperEl ? wrapperEl.style.borderLeftColor : '') || '#000000';
        const bgVal = rgbToHex(wrapperEl ? wrapperEl.style.backgroundColor : '') || '#f9f9f9';
        const alignVal = wrapperEl ? wrapperEl.style.textAlign || 'left' : 'left';

        customizerFields.innerHTML = `
          <div class="customizer-group">
            <label>Callout Text</label>
            <textarea class="customizer-input" id="cCalloutText" rows="4">${textVal}</textarea>
          </div>
          <div class="customizer-group">
            <label>Accent Border Color</label>
            <input type="color" class="customizer-input" id="cCalloutBorder" value="${borderVal}">
          </div>
          <div class="customizer-group">
            <label>Background Color</label>
            <input type="color" class="customizer-input" id="cCalloutBg" value="${bgVal}">
          </div>
          <div class="customizer-group">
            <label>Text Alignment</label>
            <select class="customizer-select" id="cCalloutAlign">
              <option value="left" ${alignVal === 'left' ? 'selected' : ''}>Left</option>
              <option value="center" ${alignVal === 'center' ? 'selected' : ''}>Center</option>
              <option value="right" ${alignVal === 'right' ? 'selected' : ''}>Right</option>
            </select>
          </div>
        `;

        document.getElementById('cCalloutText').addEventListener('input', function () {
          if (wrapperEl) wrapperEl.innerHTML = this.value.replace(/\n/g, '<br>');
        });
        document.getElementById('cCalloutBorder').addEventListener('input', function () {
          if (wrapperEl) wrapperEl.style.borderLeftColor = this.value;
        });
        document.getElementById('cCalloutBg').addEventListener('input', function () {
          if (wrapperEl) wrapperEl.style.backgroundColor = this.value;
        });
        document.getElementById('cCalloutAlign').addEventListener('change', function () {
          if (wrapperEl) wrapperEl.style.textAlign = this.value;
        });
      } else if (type === 'video') {
        const linkEl = item.querySelector('a');
        const imgEl = item.querySelector('.builder-video-thumb');
        const playBtn = item.querySelector('.builder-video-play-btn');

        const videoUrl = linkEl ? linkEl.getAttribute('href') : 'https://youtube.com';
        const thumbUrl = imgEl ? imgEl.getAttribute('src') : '';
        const playBgColor = rgbToHex(playBtn ? playBtn.style.backgroundColor : '') || '#000000';

        customizerFields.innerHTML = `
          <div class="customizer-group">
            <label>Video Link URL</label>
            <input type="text" class="customizer-input" id="cVideoUrl" value="${videoUrl}">
          </div>
          <div class="customizer-group">
            <label>Thumbnail Image URL</label>
            <input type="text" class="customizer-input" id="cVideoThumb" value="${thumbUrl}">
          </div>
          <div class="customizer-group">
            <label>Play Button Background Color</label>
            <input type="color" class="customizer-input" id="cVideoPlayBg" value="${playBgColor}">
          </div>
        `;

        document.getElementById('cVideoUrl').addEventListener('input', function () {
          if (linkEl) linkEl.setAttribute('href', this.value || 'https://youtube.com');
        });
        document.getElementById('cVideoThumb').addEventListener('input', function () {
          if (imgEl) imgEl.setAttribute('src', this.value || 'images/dashboard-illustration.png');
        });
        document.getElementById('cVideoPlayBg').addEventListener('input', function () {
          if (playBtn) playBtn.style.backgroundColor = this.value;
        });
      } else if (type === 'columns-three') {
        const cols = item.querySelectorAll('.builder-column-third');
        
        const t1 = cols[0] ? cols[0].querySelector('h4')?.textContent || '' : '';
        const p1 = cols[0] ? cols[0].querySelector('p')?.textContent || '' : '';
        const t2 = cols[1] ? cols[1].querySelector('h4')?.textContent || '' : '';
        const p2 = cols[1] ? cols[1].querySelector('p')?.textContent || '' : '';
        const t3 = cols[2] ? cols[2].querySelector('h4')?.textContent || '' : '';
        const p3 = cols[2] ? cols[2].querySelector('p')?.textContent || '' : '';

        customizerFields.innerHTML = `
          <div class="customizer-group" style="border-bottom:1px solid #e5e5e5; padding-bottom:8px;">
            <label><strong>Column 1</strong></label>
            <label>Title</label>
            <input type="text" class="customizer-input" id="cCol3T1" value="${t1}">
            <label>Description</label>
            <textarea class="customizer-input" id="cCol3P1" rows="2">${p1}</textarea>
          </div>
          <div class="customizer-group" style="border-bottom:1px solid #e5e5e5; padding-bottom:8px;">
            <label><strong>Column 2</strong></label>
            <label>Title</label>
            <input type="text" class="customizer-input" id="cCol3T2" value="${t2}">
            <label>Description</label>
            <textarea class="customizer-input" id="cCol3P2" rows="2">${p2}</textarea>
          </div>
          <div class="customizer-group">
            <label><strong>Column 3</strong></label>
            <label>Title</label>
            <input type="text" class="customizer-input" id="cCol3T3" value="${t3}">
            <label>Description</label>
            <textarea class="customizer-input" id="cCol3P3" rows="2">${p3}</textarea>
          </div>
        `;

        const bindColListeners = (colIdx, titleId, descId) => {
          const col = cols[colIdx];
          if (!col) return;
          const h4 = col.querySelector('h4');
          const p = col.querySelector('p');

          document.getElementById(titleId).addEventListener('input', function () {
            if (h4) h4.textContent = this.value;
          });
          document.getElementById(descId).addEventListener('input', function () {
            if (p) p.innerHTML = this.value.replace(/\n/g, '<br>');
          });
        };

        bindColListeners(0, 'cCol3T1', 'cCol3P1');
        bindColListeners(1, 'cCol3T2', 'cCol3P2');
        bindColListeners(2, 'cCol3T3', 'cCol3P3');
      }
    }

    // C. Initialize a drop-item with interactive listeners
    function initDropItem(item) {
      // Click selection
      item.addEventListener('click', function (e) {
        e.stopPropagation();
        selectBlock(item);
      });

      // Grab-to-sort drag event handles
      item.addEventListener('dragstart', function (e) {
        item.classList.add('dragging');
        e.stopPropagation();
      });

      item.addEventListener('dragend', function (e) {
        item.classList.remove('dragging');
        e.stopPropagation();
      });

      // Delete block action
      const deleteBtn = item.querySelector('.btn-delete-block');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          if (item === selectedItem) {
            deselectAllBlocks();
          }
          item.style.transform = 'scale(0.9)';
          item.style.opacity = '0';
          setTimeout(() => {
            item.remove();
            checkPlaceholder();
          }, 250);
        });
      }
    }

    // D. Drag/Drop reorder sorting container logic
    emailDropzone.addEventListener('dragover', function (e) {
      e.preventDefault();
      emailDropzone.classList.add('dragover');
      
      const draggingItem = document.querySelector('.drop-item.dragging');
      if (draggingItem) {
        const afterElement = getDragAfterElement(emailDropzone, e.clientY);
        if (afterElement == null) {
          emailDropzone.appendChild(draggingItem);
        } else {
          emailDropzone.insertBefore(draggingItem, afterElement);
        }
      }
    });

    emailDropzone.addEventListener('dragleave', function () {
      emailDropzone.classList.remove('dragover');
    });

    emailDropzone.addEventListener('drop', function (e) {
      e.preventDefault();
      emailDropzone.classList.remove('dragover');

      // Check if dropping a new library block
      const type = e.dataTransfer.getData('text/plain');
      if (type && !document.querySelector('.drop-item.dragging')) {
        const newItem = createBlockItem(type);
        const afterElement = getDragAfterElement(emailDropzone, e.clientY);
        
        if (afterElement == null) {
          emailDropzone.appendChild(newItem);
        } else {
          emailDropzone.insertBefore(newItem, afterElement);
        }
        
        selectBlock(newItem);
        checkPlaceholder();
      }
    });

    function getDragAfterElement(container, y) {
      const draggableElements = [...container.querySelectorAll('.drop-item:not(.dragging)')];
      return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // E. Dynamic block generator mapping library blocks to HTML mock elements
    function createBlockItem(type) {
      const item = document.createElement('div');
      item.className = 'drop-item';
      item.setAttribute('data-type', type);
      item.setAttribute('draggable', 'true');

      let blockHtml = '';

      if (type === 'header') {
        blockHtml = `
          <div class="builder-header-block" style="text-align: center; border-bottom: 3px solid #f05a28; padding: 20px 10px; background-color: #ffffff;">
            <a href="#" onclick="return false;"><img src="images/logo.png" alt="7 Days Creation" style="height: 32px; display: block; margin: 0 auto 6px;"></a>
            <h3 class="header-title" style="font-size: 20px; font-weight: 700; margin: 0; color: #000000; font-family: 'Inter', sans-serif;">7 Days Creation</h3>
            <div class="header-subtitle" style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #f05a28; letter-spacing: 1px; margin-top: 4px;">ADVERTISER PORTAL</div>
          </div>
        `;
      } else if (type === 'otp-card') {
        blockHtml = `
          <div class="builder-otp-block" style="text-align: center; margin: 0 auto; padding: 24px 20px; font-family: 'Inter', sans-serif; background-color: #ffffff; width: 100%; box-sizing: border-box;">
            <div class="builder-otp-badge" style="display: inline-block; background-color: #f05a28; color: #ffffff; padding: 6px 16px; border-radius: 20px; font-size: 11px; font-weight: 700; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Verification Code</div>
            <h3 class="builder-otp-title" style="font-size: 22px; font-weight: 700; margin: 0 0 10px; color: #000000;">Check your inbox</h3>
            <p class="builder-otp-desc" style="font-size: 13px; color: #71717a; margin: 0 auto 20px; max-width: 340px; line-height: 1.5;">Use the code below to log in to your Advertiser Portal account. This code expires in 10 minutes.</p>
            <div class="builder-otp-code-container" style="display: inline-block; padding: 14px 28px; border: 1px dashed #e5e5e5; border-radius: 6px; background-color: #f9f9f9; font-size: 32px; font-weight: 800; letter-spacing: 4px; color: #000000; font-family: monospace;">439484</div>
          </div>
        `;
      } else if (type === 'text') {
        blockHtml = `
          <div class="builder-text-block" contenteditable="true">
            Dear Client, edit this block or double click to type inline text...
          </div>
        `;
      } else if (type === 'image') {
        blockHtml = `
          <div class="builder-image-block">
            <a href="#" onclick="return false;"><img src="images/logo.png" alt="Placeholder"></a>
          </div>
        `;
      } else if (type === 'columns-left-img') {
        blockHtml = `
          <div class="builder-columns-block">
            <div class="builder-column-half">
              <img src="images/logo.png" alt="Left Column Image">
            </div>
            <div class="builder-column-half">
              <p>This is a double-column layout with an image on the left and text on the right. Customize this text using the properties panel.</p>
            </div>
          </div>
        `;
      } else if (type === 'columns-right-img') {
        blockHtml = `
          <div class="builder-columns-block">
            <div class="builder-column-half">
              <p>This is a double-column layout with text on the left and an image on the right. Customize this text using the properties panel.</p>
            </div>
            <div class="builder-column-half">
              <img src="images/logo.png" alt="Right Column Image">
            </div>
          </div>
        `;
      } else if (type === 'columns-three') {
        blockHtml = `
          <div class="builder-columns-three-block" style="display: flex; gap: 16px; padding: 12px;">
            <div class="builder-column-third" style="flex: 1; text-align: center; padding: 12px; border: 1px solid #e5e5e5; border-radius: 6px; background-color: #ffffff; min-width: 80px;">
              <h4 style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #000000;">Column 1</h4>
              <p style="margin: 0; font-size: 11px; color: #71717a; line-height: 1.4;">Add description for first column item.</p>
            </div>
            <div class="builder-column-third" style="flex: 1; text-align: center; padding: 12px; border: 1px solid #e5e5e5; border-radius: 6px; background-color: #ffffff; min-width: 80px;">
              <h4 style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #000000;">Column 2</h4>
              <p style="margin: 0; font-size: 11px; color: #71717a; line-height: 1.4;">Add description for second column item.</p>
            </div>
            <div class="builder-column-third" style="flex: 1; text-align: center; padding: 12px; border: 1px solid #e5e5e5; border-radius: 6px; background-color: #ffffff; min-width: 80px;">
              <h4 style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #000000;">Column 3</h4>
              <p style="margin: 0; font-size: 11px; color: #71717a; line-height: 1.4;">Add description for third column item.</p>
            </div>
          </div>
        `;
      } else if (type === 'spacer') {
        blockHtml = `
          <div class="builder-spacer-block" style="height: 30px;"></div>
        `;
      } else if (type === 'product-card') {
        blockHtml = `
          <div class="builder-product-block" style="text-align: center; margin: 0 auto;">
            <img src="images/logo.png" alt="Product Image">
            <h4 class="builder-product-title">Luxury Villa Launch</h4>
            <div class="builder-product-price">₹ 7,500,000</div>
            <a href="#" class="builder-product-btn" onclick="return false;">Enquire Now</a>
          </div>
        `;
      } else if (type === 'button') {
        blockHtml = `
          <div class="builder-button-block">
            <a href="#" class="button-link" onclick="return false;">Click Link Button</a>
          </div>
        `;
      } else if (type === 'video') {
        blockHtml = `
          <div class="builder-video-block" style="text-align: center; padding: 10px;">
            <a href="https://youtube.com" target="_blank" style="display: inline-block; position: relative; max-width: 100%; text-decoration: none;">
              <img src="images/dashboard-illustration.png" alt="Video Thumbnail" class="builder-video-thumb" style="max-width: 100%; border-radius: 6px; display: block; filter: brightness(0.85); width: 100%; height: auto;">
              <div class="builder-video-play-btn" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0, 0, 0, 0.75); color: #ffffff; width: 54px; height: 54px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; transition: all 0.25s; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
                <i class="fas fa-play" style="margin-left: 4px;"></i>
              </div>
            </a>
          </div>
        `;
      } else if (type === 'social') {
        blockHtml = `
          <div class="builder-social-block" style="text-align: center; padding: 16px 10px; background-color: transparent;">
            <a href="#" class="social-icon-fb" style="display: inline-block; margin: 0 10px; color: #000000; font-size: 18px; text-decoration: none;"><i class="fab fa-facebook-f"></i></a>
            <a href="#" class="social-icon-x" style="display: inline-block; margin: 0 10px; color: #000000; font-size: 18px; text-decoration: none;"><i class="fab fa-x-twitter"></i></a>
            <a href="#" class="social-icon-ig" style="display: inline-block; margin: 0 10px; color: #000000; font-size: 18px; text-decoration: none;"><i class="fab fa-instagram"></i></a>
            <a href="#" class="social-icon-li" style="display: inline-block; margin: 0 10px; color: #000000; font-size: 18px; text-decoration: none;"><i class="fab fa-linkedin-in"></i></a>
            <a href="#" class="social-icon-yt" style="display: inline-block; margin: 0 10px; color: #000000; font-size: 18px; text-decoration: none;"><i class="fab fa-youtube"></i></a>
          </div>
        `;
      } else if (type === 'callout') {
        blockHtml = `
          <div class="builder-callout-block" style="padding: 10px 12px;">
            <div class="builder-callout-wrapper" style="border-left: 4px solid #000000; background-color: #f9f9f9; padding: 12px 16px; font-size: 13px; color: #333333; line-height: 1.6; border-radius: 0 4px 4px 0; text-align: left;">
              This is a premium callout box. You can highlight key announcements, important quotes, or warnings here.
            </div>
          </div>
        `;
      } else if (type === 'divider') {
        blockHtml = `
          <div class="builder-divider-block">
            <hr>
          </div>
        `;
      }

      item.innerHTML = `
        <div class="drop-item-actions">
          <span><i class="fas fa-grip-vertical"></i></span>
          <button type="button" class="btn-delete-block" title="Delete"><i class="fas fa-trash-can"></i></button>
        </div>
        ${blockHtml}
      `;

      initDropItem(item);
      return item;
    }

    // F. Drag block libraries setup
    const libraryBlocks = document.querySelectorAll('.drag-block');
    libraryBlocks.forEach(block => {
      block.addEventListener('dragstart', function (e) {
        e.dataTransfer.setData('text/plain', this.getAttribute('data-type'));
        this.style.opacity = '0.5';
      });

      block.addEventListener('dragend', function () {
        this.style.opacity = '1';
      });
    });

    // Check placeholder function
    const placeholder = document.getElementById('dropzonePlaceholder');
    function checkPlaceholder() {
      if (placeholder) {
        const blocks = emailDropzone.querySelectorAll('.drop-item');
        placeholder.style.display = blocks.length === 0 ? 'flex' : 'none';
      }
    }

    // G. Bind pre-populated default blocks
    const prepopulated = emailDropzone.querySelectorAll('.drop-item');
    prepopulated.forEach(item => {
      initDropItem(item);
    });

    // Unselect on empty dropzone click
    emailDropzone.addEventListener('click', deselectAllBlocks);
    checkPlaceholder();

    // =============================================
    // VARIABLES PERSONALIZATION HELPER
    // =============================================
    function insertVariable(variable) {
      if (!selectedItem) {
        showToast("Please select a Text Block first.");
        return;
      }
      const type = selectedItem.getAttribute('data-type');
      
      if (type === 'text') {
        const textBlock = selectedItem.querySelector('.builder-text-block');
        const textarea = document.getElementById('cTextContent');
        
        if (textarea) {
          const startPos = textarea.selectionStart;
          const endPos = textarea.selectionEnd;
          const val = textarea.value;
          const newVal = val.substring(0, startPos) + variable + val.substring(endPos, val.length);
          textarea.value = newVal;
          
          if (textBlock) {
            textBlock.innerHTML = newVal.replace(/\n/g, '<br>');
          }
          textarea.focus();
          textarea.selectionStart = textarea.selectionEnd = startPos + variable.length;
        } else if (textBlock) {
          textBlock.innerHTML += variable;
        }
      } else if (type === 'columns-left-img' || type === 'columns-right-img') {
        const pEl = selectedItem.querySelector('.builder-column-half p');
        const textarea = document.getElementById('cColText');
        
        if (textarea) {
          const startPos = textarea.selectionStart;
          const endPos = textarea.selectionEnd;
          const val = textarea.value;
          const newVal = val.substring(0, startPos) + variable + val.substring(endPos, val.length);
          textarea.value = newVal;
          
          if (pEl) {
            pEl.innerHTML = newVal.replace(/\n/g, '<br>');
          }
          textarea.focus();
          textarea.selectionStart = textarea.selectionEnd = startPos + variable.length;
        } else if (pEl) {
          pEl.innerHTML += variable;
        }
      } else if (type === 'product-card') {
        const activeInput = document.activeElement;
        if (activeInput && activeInput.classList.contains('customizer-input')) {
          const startPos = activeInput.selectionStart;
          const endPos = activeInput.selectionEnd;
          const val = activeInput.value;
          const newVal = val.substring(0, startPos) + variable + val.substring(endPos, val.length);
          activeInput.value = newVal;
          activeInput.dispatchEvent(new Event('input'));
          activeInput.focus();
          activeInput.selectionStart = activeInput.selectionEnd = startPos + variable.length;
        } else {
          showToast("Select a field in Block Properties to insert variable.");
        }
      } else {
        showToast("Variables can only be inserted into Text blocks or customizer inputs.");
      }
    }

    // Bind click events on chips
    const varChips = document.querySelectorAll('.var-chip');
    varChips.forEach(chip => {
      chip.addEventListener('click', function (e) {
        e.stopPropagation();
        const variable = this.getAttribute('data-var');
        insertVariable(variable);
      });
    });

    // =============================================
    // TEMPLATES STORAGE MANAGER
    // =============================================
    function getTemplates() {
      return JSON.parse(localStorage.getItem('saved_email_templates') || '[]');
    }

    function saveTemplates(templates) {
      localStorage.setItem('saved_email_templates', JSON.stringify(templates));
    }

    const btnSaveTmpl = document.getElementById('btnSaveTmpl');
    const tmplSaveName = document.getElementById('tmplSaveName');
    const savedTmplList = document.getElementById('savedTmplList');

    if (btnSaveTmpl && tmplSaveName) {
      btnSaveTmpl.addEventListener('click', function () {
        const name = tmplSaveName.value.trim();
        if (!name) {
          showToast("Please enter a template name.");
          tmplSaveName.classList.add('error');
          return;
        }
        tmplSaveName.classList.remove('error');

        const templates = getTemplates();
        const existingIndex = templates.findIndex(t => t.name.toLowerCase() === name.toLowerCase());

        const canvasHtml = emailDropzone.innerHTML;
        const newTmpl = {
          name: name,
          html: canvasHtml,
          subject: campSubject ? campSubject.value : '',
          campaignName: campName ? campName.value : ''
        };

        if (existingIndex > -1) {
          templates[existingIndex] = newTmpl;
          showToast(`Template "${name}" overwritten.`);
        } else {
          templates.push(newTmpl);
          showToast(`Template "${name}" saved.`);
        }

        saveTemplates(templates);
        tmplSaveName.value = '';
        renderSavedTemplatesList();
      });
    }

    function loadTemplate(tmpl) {
      emailDropzone.innerHTML = tmpl.html;

      if (campSubject && tmpl.subject) {
        campSubject.value = tmpl.subject;
        campSubject.dispatchEvent(new Event('input'));
      }
      if (campName && tmpl.campaignName) {
        campName.value = tmpl.campaignName;
      }

      // Rebind dropzone actions
      const items = emailDropzone.querySelectorAll('.drop-item');
      items.forEach(item => {
        initDropItem(item);
      });

      deselectAllBlocks();
      checkPlaceholder();
      showToast(`Loaded template "${tmpl.name}"`);
    }

    function renderSavedTemplatesList() {
      if (!savedTmplList) return;
      const templates = getTemplates();

      if (templates.length === 0) {
        savedTmplList.innerHTML = `<div class="saved-tmpl-placeholder" style="font-size:11px; color:#71717a; text-align:center; padding:10px 0;">No saved templates yet.</div>`;
        return;
      }

      savedTmplList.innerHTML = '';
      templates.forEach((tmpl, index) => {
        const item = document.createElement('div');
        item.className = 'saved-tmpl-item';
        item.innerHTML = `
          <span class="saved-tmpl-name">${tmpl.name}</span>
          <button type="button" class="btn-delete-tmpl" data-index="${index}" title="Delete"><i class="fas fa-trash-can"></i></button>
        `;

        item.addEventListener('click', function (e) {
          if (e.target.closest('.btn-delete-tmpl')) return;
          loadTemplate(tmpl);
        });

        savedTmplList.appendChild(item);
      });

      const deleteBtns = savedTmplList.querySelectorAll('.btn-delete-tmpl');
      deleteBtns.forEach(btn => {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          const index = parseInt(this.getAttribute('data-index'));
          const templates = getTemplates();
          const name = templates[index].name;
          templates.splice(index, 1);
          saveTemplates(templates);
          showToast(`Template "${name}" deleted.`);
          renderSavedTemplatesList();
        });
      });
    }

    // Populate list on load
    renderSavedTemplatesList();

    // =============================================
    // TEST EMAIL DISPATCH SIMULATOR
    // =============================================
    const testMailBtn = document.getElementById('testMailBtn');
    const testEmailModal = document.getElementById('testEmailModal');
    const closeTestModal = document.getElementById('closeTestModal');
    const cancelTestModal = document.getElementById('cancelTestModal');
    const confirmSendTest = document.getElementById('confirmSendTest');
    const testEmailInput = document.getElementById('testEmailInput');

    if (testMailBtn && testEmailModal) {
      testMailBtn.addEventListener('click', function () {
        testEmailModal.classList.add('active');
        if (testEmailInput) testEmailInput.focus();
      });

      const closeModal = function () {
        testEmailModal.classList.remove('active');
        if (testEmailInput) testEmailInput.value = '';
        confirmSendTest.classList.remove('loading');
        confirmSendTest.disabled = false;
      };

      if (closeTestModal) closeTestModal.addEventListener('click', closeModal);
      if (cancelTestModal) cancelTestModal.addEventListener('click', closeModal);

      testEmailModal.addEventListener('click', function (e) {
        if (e.target === testEmailModal) {
          closeModal();
        }
      });

      if (confirmSendTest && testEmailInput) {
        confirmSendTest.addEventListener('click', function () {
          const email = testEmailInput.value.trim();
          
          if (!email || !email.includes('@')) {
            testEmailInput.classList.add('error');
            showToast("Please enter a valid email address.");
            return;
          }
          testEmailInput.classList.remove('error');

          const items = emailDropzone.querySelectorAll('.drop-item');
          if (items.length === 0) {
            showToast("Cannot send an empty email. Add some blocks first.");
            return;
          }

          confirmSendTest.classList.add('loading');
          confirmSendTest.disabled = true;

          setTimeout(() => {
            showToast(`Test email successfully sent to ${email}`);
            closeModal();
          }, 1200);
        });
      }
    }
  }

  // =============================================
  // COMPILE DRAG & DROP HTML FOR BLAST STORAGE
  // =============================================
  function compileEmailHtml() {
    if (!emailDropzone) return '';
    
    let html = '';
    const items = emailDropzone.querySelectorAll('.drop-item');
    
    if (items.length === 0) return '(Empty Email Template Body)';
    
    items.forEach(item => {
      const type = item.getAttribute('data-type');
      if (type === 'header') {
        const headerBlock = item.querySelector('.builder-header-block');
        const titleEl = item.querySelector('.header-title');
        const subtitleEl = item.querySelector('.header-subtitle');
        const imgEl = item.querySelector('img');

        const title = titleEl ? titleEl.textContent : '7 Days Creation';
        const subtitle = subtitleEl ? subtitleEl.textContent : '';
        const align = headerBlock ? headerBlock.style.textAlign || 'center' : 'center';

        const logoSrc = imgEl ? imgEl.getAttribute('src') || '' : '';
        let absoluteLogo = logoSrc;
        if (logoSrc.startsWith('images/')) {
          absoluteLogo = 'https://7dayscreation.com/communication/' + logoSrc;
        }

        const logoHeight = imgEl ? imgEl.style.height || '32px' : '32px';
        const bgColor = rgbToHex(headerBlock ? headerBlock.style.backgroundColor : '') || '#ffffff';
        const borderBottomColor = rgbToHex(headerBlock ? headerBlock.style.borderBottomColor : '') || '#f05a28';
        const borderBottomWidth = headerBlock ? headerBlock.style.borderBottomWidth || '3px' : '3px';

        const titleColor = rgbToHex(titleEl ? titleEl.style.color : '') || '#000000';
        const subtitleColor = rgbToHex(subtitleEl ? subtitleEl.style.color : '') || '#f05a28';

        const linkEl = item.querySelector('.builder-header-block a');
        const linkHref = linkEl ? linkEl.getAttribute('href') : '';
        const hasLink = linkHref && linkHref !== '#' && linkHref !== '';

        html += `
          <div style="text-align: ${align}; padding: 20px 10px; background-color: ${bgColor}; border-bottom: ${borderBottomWidth} solid ${borderBottomColor}; font-family: sans-serif;">
            ${hasLink ? `<a href="${linkHref}" target="_blank" style="text-decoration: none;">` : ''}
            <img src="${absoluteLogo}" alt="Logo" style="height: ${logoHeight}; max-width: 100%; display: inline-block;">
            ${hasLink ? `</a>` : ''}
            <h2 style="font-size: 20px; font-weight: 700; margin: 8px 0 0; color: ${titleColor}; font-family: 'Inter', sans-serif;">${title}</h2>
            ${subtitle ? `<div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: ${subtitleColor}; letter-spacing: 1px; margin-top: 4px;">${subtitle}</div>` : ''}
          </div>
        `;
      } else if (type === 'otp-card') {
        const badgeEl = item.querySelector('.builder-otp-badge');
        const titleEl = item.querySelector('.builder-otp-title');
        const descEl = item.querySelector('.builder-otp-desc');
        const codeEl = item.querySelector('.builder-otp-code-container');

        const badgeText = badgeEl ? badgeEl.textContent : 'Verification Code';
        const badgeBg = badgeEl ? badgeEl.style.backgroundColor || '#f05a28' : '#f05a28';
        const titleText = titleEl ? titleEl.textContent : 'Check your inbox';
        const descHtml = descEl ? descEl.innerHTML.trim() : '';
        const codeText = codeEl ? codeEl.textContent : '';
        const codeBg = codeEl ? codeEl.style.backgroundColor || '#f9f9f9' : '#f9f9f9';
        const borderStyle = codeEl ? codeEl.style.borderStyle || 'dashed' : 'dashed';
        const borderWidth = borderStyle === 'none' ? '0' : '1px';

        html += `
          <div style="text-align: center; padding: 24px 20px; font-family: sans-serif; background-color: #ffffff;">
            <div style="display: inline-block; background-color: ${badgeBg}; color: #ffffff; padding: 6px 16px; border-radius: 20px; font-size: 11px; font-weight: 700; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
              ${badgeText}
            </div>
            <h3 style="font-size: 22px; font-weight: 700; margin: 0 0 10px; color: #000000;">${titleText}</h3>
            <p style="font-size: 13px; color: #71717a; margin: 0 auto 20px; max-width: 340px; line-height: 1.5;">${descHtml}</p>
            <div style="display: inline-block; padding: 14px 28px; border: ${borderWidth} ${borderStyle} #e5e5e5; border-radius: 6px; background-color: ${codeBg}; font-size: 32px; font-weight: 800; letter-spacing: 4px; color: #000000; font-family: monospace;">
              ${codeText}
            </div>
          </div>
        `;
      } else if (type === 'social') {
        const socialBlock = item.querySelector('.builder-social-block');
        const align = socialBlock ? socialBlock.style.textAlign || 'center' : 'center';
        
        const fbEl = item.querySelector('.social-icon-fb');
        const xEl = item.querySelector('.social-icon-x');
        const igEl = item.querySelector('.social-icon-ig');
        const liEl = item.querySelector('.social-icon-li');
        const ytEl = item.querySelector('.social-icon-yt');

        const fbUrl = fbEl ? fbEl.getAttribute('href') || '#' : '#';
        const xUrl = xEl ? xEl.getAttribute('href') || '#' : '#';
        const igUrl = igEl ? igEl.getAttribute('href') || '#' : '#';
        const liUrl = liEl ? liEl.getAttribute('href') || '#' : '#';
        const ytUrl = ytEl ? ytEl.getAttribute('href') || '#' : '#';

        const fbShow = fbEl && fbEl.style.display !== 'none';
        const xShow = xEl && xEl.style.display !== 'none';
        const igShow = igEl && igEl.style.display !== 'none';
        const liShow = liEl && liEl.style.display !== 'none';
        const ytShow = ytEl && ytEl.style.display !== 'none';
        
        const color = fbEl ? fbEl.style.color || '#000000' : '#000000';

        html += `
          <div style="text-align: ${align}; padding: 16px 10px; font-family: sans-serif;">
        `;
        if (fbShow) {
          html += `<a href="${fbUrl}" target="_blank" style="display: inline-block; margin: 0 10px; color: ${color}; font-size: 14px; text-decoration: none;">Facebook</a>`;
        }
        if (xShow) {
          html += `<a href="${xUrl}" target="_blank" style="display: inline-block; margin: 0 10px; color: ${color}; font-size: 14px; text-decoration: none;">X / Twitter</a>`;
        }
        if (igShow) {
          html += `<a href="${igUrl}" target="_blank" style="display: inline-block; margin: 0 10px; color: ${color}; font-size: 14px; text-decoration: none;">Instagram</a>`;
        }
        if (liShow) {
          html += `<a href="${liUrl}" target="_blank" style="display: inline-block; margin: 0 10px; color: ${color}; font-size: 14px; text-decoration: none;">LinkedIn</a>`;
        }
        if (ytShow) {
          html += `<a href="${ytUrl}" target="_blank" style="display: inline-block; margin: 0 10px; color: ${color}; font-size: 14px; text-decoration: none;">YouTube</a>`;
        }
        html += `
          </div>
        `;
      } else if (type === 'callout') {
        const wrapperEl = item.querySelector('.builder-callout-wrapper');
        const textHtml = wrapperEl ? wrapperEl.innerHTML.trim() : '';
        const borderVal = wrapperEl ? wrapperEl.style.borderLeftColor || '#000000' : '#000000';
        const bgVal = wrapperEl ? wrapperEl.style.backgroundColor || '#f9f9f9' : '#f9f9f9';
        const align = wrapperEl ? wrapperEl.style.textAlign || 'left' : 'left';

        html += `
          <div style="padding: 10px 15px; font-family: sans-serif;">
            <div style="border-left: 4px solid ${borderVal}; background-color: ${bgVal}; padding: 12px 16px; font-size: 13px; color: #333333; line-height: 1.6; border-radius: 0 4px 4px 0; text-align: ${align};">
              ${textHtml}
            </div>
          </div>
        `;
      } else if (type === 'video') {
        const linkEl = item.querySelector('a');
        const imgEl = item.querySelector('.builder-video-thumb');
        const playBtn = item.querySelector('.builder-video-play-btn');

        const videoUrl = linkEl ? linkEl.getAttribute('href') || 'https://youtube.com' : 'https://youtube.com';
        const thumbUrl = imgEl ? imgEl.getAttribute('src') || '' : '';
        const playBgColor = playBtn ? playBtn.style.backgroundColor || 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.75)';

        let absoluteThumb = thumbUrl;
        if (thumbUrl.startsWith('images/')) {
          absoluteThumb = 'https://7dayscreation.com/communication/' + thumbUrl;
        }

        html += `
          <div style="text-align: center; padding: 10px; font-family: sans-serif;">
            <a href="${videoUrl}" target="_blank" style="display: inline-block; position: relative; max-width: 100%; text-decoration: none;">
              <img src="${absoluteThumb}" alt="Video Playback" style="max-width: 100%; border-radius: 6px; display: block; filter: brightness(0.85);">
              <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: ${playBgColor}; color: #ffffff; width: 54px; height: 54px; border-radius: 50%; text-align: center; line-height: 54px; font-size: 20px; font-weight: bold; display: inline-block; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
                ▶
              </div>
            </a>
          </div>
        `;
      } else if (type === 'columns-three') {
        const cols = item.querySelectorAll('.builder-column-third');
        
        const t1 = cols[0] ? cols[0].querySelector('h4')?.textContent || '' : '';
        const p1 = cols[0] ? cols[0].querySelector('p')?.innerHTML || '' : '';
        const t2 = cols[1] ? cols[1].querySelector('h4')?.textContent || '' : '';
        const p2 = cols[1] ? cols[1].querySelector('p')?.innerHTML || '' : '';
        const t3 = cols[2] ? cols[2].querySelector('h4')?.textContent || '' : '';
        const p3 = cols[2] ? cols[2].querySelector('p')?.innerHTML || '' : '';

        html += `
          <div style="padding: 15px; font-family: sans-serif; font-size: 0; text-align: center;">
            <!--[if mso]>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr><td width="33.3%" valign="top">
            <![endif]-->
            <div style="display: inline-block; width: 100%; max-width: 170px; vertical-align: top; margin: 10px 5px; border: 1px solid #e5e5e5; border-radius: 6px; background-color: #ffffff; padding: 12px; box-sizing: border-box; text-align: center;">
              <h4 style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #000000;">${t1}</h4>
              <p style="margin: 0; font-size: 11px; color: #71717a; line-height: 1.4;">${p1}</p>
            </div>
            <!--[if mso]>
            </td><td width="33.3%" valign="top">
            <![endif]-->
            <div style="display: inline-block; width: 100%; max-width: 170px; vertical-align: top; margin: 10px 5px; border: 1px solid #e5e5e5; border-radius: 6px; background-color: #ffffff; padding: 12px; box-sizing: border-box; text-align: center;">
              <h4 style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #000000;">${t2}</h4>
              <p style="margin: 0; font-size: 11px; color: #71717a; line-height: 1.4;">${p2}</p>
            </div>
            <!--[if mso]>
            </td><td width="33.3%" valign="top">
            <![endif]-->
            <div style="display: inline-block; width: 100%; max-width: 170px; vertical-align: top; margin: 10px 5px; border: 1px solid #e5e5e5; border-radius: 6px; background-color: #ffffff; padding: 12px; box-sizing: border-box; text-align: center;">
              <h4 style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #000000;">${t3}</h4>
              <p style="margin: 0; font-size: 11px; color: #71717a; line-height: 1.4;">${p3}</p>
            </div>
            <!--[if mso]>
            </td></tr></table>
            <![endif]-->
          </div>
        `;
      } else if (type === 'text') {
        const textBlock = item.querySelector('.builder-text-block');
        const text = textBlock ? textBlock.innerHTML.trim() : '';
        const align = textBlock ? textBlock.style.textAlign || 'left' : 'left';
        const fontSize = textBlock ? textBlock.style.fontSize || '13px' : '13px';
        html += `
          <div style="text-align: ${align}; font-size: ${fontSize}; color: #333333; line-height: 1.6; padding: 10px 15px; font-family: sans-serif;">
            ${text}
          </div>
        `;
      } else if (type === 'image') {
        const img = item.querySelector('img');
        const src = img ? img.getAttribute('src') || '' : '';
        const width = img ? img.style.maxWidth || '100%' : '100%';
        const align = item.querySelector('.builder-image-block')?.style.textAlign || 'center';
        const linkEl = item.querySelector('.builder-image-block a');
        const linkHref = linkEl ? linkEl.getAttribute('href') : '';
        const hasLink = linkHref && linkHref !== '#' && linkHref !== '';

        html += `
          <div style="text-align: ${align}; padding: 10px;">
            ${hasLink ? `<a href="${linkHref}" target="_blank" style="text-decoration: none;">` : ''}
            <img src="${src}" alt="Campaign Image" style="max-width: ${width}; height: auto; border-radius: 4px; display: inline-block;">
            ${hasLink ? `</a>` : ''}
          </div>
        `;
      } else if (type === 'columns-left-img') {
        const img = item.querySelector('img');
        const src = img ? img.getAttribute('src') || '' : '';
        const p = item.querySelector('.builder-column-half p');
        const text = p ? p.innerHTML.trim() : '';
        const align = p ? p.style.textAlign || 'left' : 'left';
        html += `
          <div class="compiled-columns" style="padding: 15px; font-family: sans-serif; font-size: 0;">
            <!--[if mso]>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr><td width="50%" valign="top">
            <![endif]-->
            <div style="display: inline-block; width: 100%; max-width: 270px; vertical-align: top; margin-bottom: 10px;">
              <img src="${src}" alt="Image" style="width: 100%; height: auto; border-radius: 4px; display: block;">
            </div>
            <!--[if mso]>
            </td><td width="50%" valign="top">
            <![endif]-->
            <div style="display: inline-block; width: 100%; max-width: 270px; vertical-align: top; padding-left: 10px; box-sizing: border-box;">
              <p style="margin: 0; font-size: 13px; color: #333333; line-height: 1.6; text-align: ${align};">${text}</p>
            </div>
            <!--[if mso]>
            </td></tr></table>
            <![endif]-->
          </div>
        `;
      } else if (type === 'columns-right-img') {
        const img = item.querySelector('img');
        const src = img ? img.getAttribute('src') || '' : '';
        const p = item.querySelector('.builder-column-half p');
        const text = p ? p.innerHTML.trim() : '';
        const align = p ? p.style.textAlign || 'left' : 'left';
        html += `
          <div class="compiled-columns" style="padding: 15px; font-family: sans-serif; font-size: 0;">
            <!--[if mso]>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr><td width="50%" valign="top">
            <![endif]-->
            <div style="display: inline-block; width: 100%; max-width: 270px; vertical-align: top; padding-right: 10px; box-sizing: border-box; margin-bottom: 10px;">
              <p style="margin: 0; font-size: 13px; color: #333333; line-height: 1.6; text-align: ${align};">${text}</p>
            </div>
            <!--[if mso]>
            </td><td width="50%" valign="top">
            <![endif]-->
            <div style="display: inline-block; width: 100%; max-width: 270px; vertical-align: top;">
              <img src="${src}" alt="Image" style="width: 100%; height: auto; border-radius: 4px; display: block;">
            </div>
            <!--[if mso]>
            </td></tr></table>
            <![endif]-->
          </div>
        `;
      } else if (type === 'spacer') {
        const spacer = item.querySelector('.builder-spacer-block');
        const height = spacer ? spacer.style.height || '30px' : '30px';
        html += `
          <div style="height: ${height}; line-height: ${height}; font-size: 1px;">&nbsp;</div>
        `;
      } else if (type === 'product-card') {
        const img = item.querySelector('img');
        const titleEl = item.querySelector('.builder-product-title');
        const priceEl = item.querySelector('.builder-product-price');
        const btnEl = item.querySelector('.builder-product-btn');
        const containerEl = item.querySelector('.builder-product-block');

        const src = img ? img.getAttribute('src') || '' : '';
        const title = titleEl ? titleEl.textContent : 'Luxury Villa Launch';
        const price = priceEl ? priceEl.textContent : '₹ 7,500,000';
        const href = btnEl ? btnEl.getAttribute('href') : '#';
        const btnText = btnEl ? btnEl.textContent : 'Enquire Now';
        const align = containerEl ? containerEl.style.textAlign || 'center' : 'center';

        let marginStyle = 'margin: 0 auto;';
        if (align === 'left') marginStyle = 'margin: 0 auto 0 0;';
        else if (align === 'right') marginStyle = 'margin: 0 0 0 auto;';

        html += `
          <div style="padding: 15px; font-family: sans-serif; text-align: ${align};">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="${marginStyle} width: 280px; border: 1px solid #e5e5e5; border-radius: 8px; background: #ffffff; text-align: center;">
              <tr>
                <td style="padding: 12px;">
                  <img src="${src}" alt="Product Image" style="max-width: 100%; height: 150px; object-fit: contain; border-radius: 4px; display: block; margin: 0 auto 8px;">
                  <h4 style="font-size: 14px; font-weight: 700; color: #000000; margin: 0 0 4px; font-family: 'Inter', sans-serif;">${title}</h4>
                  <div style="font-size: 13px; font-weight: 600; color: #71717a; margin-bottom: 8px;">${price}</div>
                  <a href="${href}" style="display: inline-block; padding: 8px 16px; background: #000000; color: #ffffff; border-radius: 4px; font-size: 11px; font-weight: 600; text-decoration: none; font-family: sans-serif;">
                    ${btnText}
                  </a>
                </td>
              </tr>
            </table>
          </div>
        `;
      } else if (type === 'button') {
        const link = item.querySelector('a');
        const label = link ? link.textContent : 'Book Now';
        const href = link ? link.getAttribute('href') : '#';
        const align = item.querySelector('.builder-button-block')?.style.textAlign || 'center';
        html += `
          <div style="text-align: ${align}; padding: 15px;">
            <a href="${href}" target="_blank" style="display: inline-block; padding: 12px 24px; background: #000000; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; border-radius: 4px; font-family: sans-serif;">
              ${label}
            </a>
          </div>
        `;
      } else if (type === 'divider') {
        const hr = item.querySelector('hr');
        const borderStyle = hr ? hr.style.borderStyle || 'solid' : 'solid';
        html += `
          <div style="padding: 10px 15px;">
            <hr style="border: none; border-top: 1px ${borderStyle} #e5e5e5; margin: 0;">
          </div>
        `;
      }
    });
    
    return html;
  }

  // =============================================
  // SUBMISSION LOGIC
  // =============================================
  if (campaignForm) {
    campaignForm.addEventListener('submit', function (e) {
      e.preventDefault();

      let hasError = false;
      campName.classList.remove('error');
      
      if (!campName.value.trim()) {
        campName.classList.add('error');
        hasError = true;
      }

      if (isEmailTemplate) {
        campSubject.classList.remove('error');
        if (!campSubject.value.trim()) {
          campSubject.classList.add('error');
          hasError = true;
        }
        
        // Ensure dropzone canvas has elements
        const elements = emailDropzone.querySelectorAll('.drop-item');
        if (elements.length === 0) {
          showToast('Please drag at least one element into your email canvas.');
          return;
        }
      }

      if (isWhatsappTemplate) {
        campBody.classList.remove('error');
        if (!campBody.value.trim()) {
          campBody.classList.add('error');
          hasError = true;
        }
      }

      if (hasError) {
        showToast('Please correct the highlighted fields.');
        return;
      }

      sendBtn.classList.add('loading');
      sendBtn.disabled = true;

      // Simulate sending blast delay
      setTimeout(() => {
        const newCamp = {
          id: Date.now(),
          name: campName.value.trim(),
          audience: campAudience.value || 'All Inquiries',
          status: "Sent",
          date: new Date().toISOString()
        };

        if (isEmailTemplate) {
          newCamp.subject = campSubject.value.trim();
          newCamp.openRate = "100.0%";
          newCamp.clickRate = "0.0%";
          newCamp.bodyHtml = compileEmailHtml(); // Dynamic compiled HTML output

          const list = JSON.parse(localStorage.getItem('email_campaigns') || '[]');
          list.unshift(newCamp);
          localStorage.setItem('email_campaigns', JSON.stringify(list));

          // Append to notification list
          const notifs = JSON.parse(localStorage.getItem('notifications') || '[]');
          const newNotif = {
            id: Date.now(),
            type: "Campaigns",
            icon: "fa-envelope",
            title: "Email Campaign Blasted",
            desc: `Drag-&-Drop template '${newCamp.name}' successfully sent to '${newCamp.audience}'.`,
            time: new Date().toISOString(),
            read: false
          };
          notifs.unshift(newNotif);
          localStorage.setItem('notifications', JSON.stringify(notifs));
          
          showToast('Email campaign blasted! Redirecting...');
          setTimeout(() => {
            window.location.href = 'email-campaign.html';
          }, 1500);

        } else if (isWhatsappTemplate) {
          const selectedTmpl = document.querySelector('input[name="campTemplate"]:checked');
          newCamp.template = selectedTmpl ? selectedTmpl.closest('.tmpl-radio').querySelector('span').textContent : 'Custom Message';
          newCamp.delivered = "100%";
          newCamp.read = "Pending";
          newCamp.message = campBody.value.trim();

          const list = JSON.parse(localStorage.getItem('whatsapp_campaigns') || '[]');
          list.unshift(newCamp);
          localStorage.setItem('whatsapp_campaigns', JSON.stringify(list));

          // Append to notification list
          const notifs = JSON.parse(localStorage.getItem('notifications') || '[]');
          const newNotif = {
            id: Date.now(),
            type: "Campaigns",
            icon: "fa-comments",
            title: "WhatsApp Campaign Sent",
            desc: `WhatsApp blast '${newCamp.name}' broadcasted to '${newCamp.audience}' segment.`,
            time: new Date().toISOString(),
            read: false
          };
          notifs.unshift(newNotif);
          localStorage.setItem('notifications', JSON.stringify(notifs));

          showToast('WhatsApp campaign blasted! Redirecting...');
          setTimeout(() => {
            window.location.href = 'whatsapp-campaign.html';
          }, 1500);
        }

      }, 1500);
    });
  }

  // =============================================
  // PROFILE DROPDOWN
  // =============================================
  const profileContainer = document.querySelector('.profile-dropdown-container');
  const profileBtn = document.getElementById('topProfileBtn');
  
  if (profileContainer && profileBtn) {
    profileBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      profileContainer.classList.toggle('active');
    });
    
    document.addEventListener('click', function (e) {
      if (!profileContainer.contains(e.target)) {
        profileContainer.classList.remove('active');
      }
    });
  }

  // Logout simulator
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      showToast('Logging out...');
      setTimeout(function () {
        window.location.href = 'index.html';
      }, 1000);
    });
  }

  // =============================================
  // NOTIFICATION BADGE SYNC
  // =============================================
  function updateGlobalBellBadge() {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const unreadCount = notifications.filter(n => !n.read).length;
    const bellBadges = document.querySelectorAll('.notif-badge');
    bellBadges.forEach(badge => {
      if (unreadCount > 0) {
        badge.style.display = 'block';
        badge.textContent = unreadCount;
      } else {
        badge.style.display = 'none';
      }
    });
  }
  updateGlobalBellBadge();

  window.addEventListener('storage', function (e) {
    if (e.key === 'notifications') {
      updateGlobalBellBadge();
    }
  });

})();
