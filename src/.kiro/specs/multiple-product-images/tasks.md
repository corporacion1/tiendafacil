# Implementation Plan - Multiple Product Images

- [x] 1. Update data models and types


  - Extend Product type to support multiple images array
  - Create ProductImage interface with all required fields
  - Add backward compatibility helpers for existing imageUrl field
  - _Requirements: 1.1, 1.2, 1.3, 4.5_






- [ ] 2. Implement image processing utilities
  - [x] 2.1 Create image validation functions

    - Write functions to validate file size (max 5MB)
    - Implement format validation (JPG, PNG, WebP)


    - Add image dimension validation utilities
    - _Requirements: 1.4, 1.5_

  - [ ] 2.2 Build image compression and thumbnail generation
    - Implement automatic image compression maintaining quality
    - Create thumbnail generation (150x150px) functionality



    - Add responsive image size generation utilities
    - _Requirements: 4.2, 4.3_

  - [ ]* 2.3 Write unit tests for image processing
    - Test image validation edge cases



    - Verify compression quality and file sizes
    - Test thumbnail generation accuracy
    - _Requirements: 1.4, 1.5, 4.2, 4.3_



- [ ] 3. Create backend API endpoints
  - [ ] 3.1 Implement multiple image upload endpoint
    - Create POST /api/products/{productId}/images endpoint
    - Handle FormData with multiple files
    - Integrate image processing pipeline


    - _Requirements: 1.1, 1.4, 1.5_



  - [ ] 3.2 Build image management endpoints
    - Implement DELETE /api/products/{productId}/images/{imageId}
    - Create PUT /api/products/{productId}/images/reorder endpoint
    - Add PUT /api/products/{productId}/images/primary endpoint
    - _Requirements: 3.2, 3.3, 3.4_


  - [ ] 3.3 Enhance product retrieval with image optimization
    - Update GET /api/products endpoints to include images array
    - Add query parameters for image size selection
    - Implement lazy loading support in API responses
    - _Requirements: 4.1, 4.3_


  - [ ]* 3.4 Write API integration tests
    - Test multiple image upload scenarios


    - Verify image reordering functionality
    - Test error handling for invalid uploads
    - _Requirements: 1.1, 3.2, 3.3_

- [x] 4. Build MultiImageUpload component


  - [x] 4.1 Create drag & drop upload interface

    - Implement file drop zone with visual feedback
    - Add click-to-upload functionality
    - Create upload progress indicators
    - _Requirements: 1.1, 1.2_


  - [ ] 4.2 Implement image preview and management
    - Build image preview grid with thumbnails
    - Add drag & drop reordering functionality
    - Create delete individual image buttons
    - Implement primary image selection indicator

    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ] 4.3 Add validation and error handling
    - Implement real-time file validation
    - Show specific error messages for invalid files
    - Add retry functionality for failed uploads
    - _Requirements: 1.4, 1.5_







  - [ ]* 4.4 Create component unit tests
    - Test drag & drop functionality
    - Verify image reordering behavior
    - Test validation error scenarios

    - _Requirements: 1.1, 3.2, 3.3_

- [ ] 5. Build ProductImageGallery component
  - [ ] 5.1 Create image carousel with navigation
    - Implement main image display with next/prev buttons

    - Add touch gesture support for mobile devices
    - Create smooth transition animations
    - _Requirements: 2.2, 2.3, 2.4_

  - [ ] 5.2 Add thumbnail navigation bar
    - Build clickeable thumbnail strip below main image
    - Implement active thumbnail highlighting
    - Add responsive layout for different screen sizes
    - _Requirements: 2.5_

  - [ ] 5.3 Implement zoom and modal functionality
    - Create click-to-zoom modal overlay
    - Add full-screen image viewing
    - Implement keyboard navigation (arrow keys, escape)


    - _Requirements: 2.3, 2.4_

  - [ ]* 5.4 Write gallery component tests
    - Test carousel navigation functionality


    - Verify touch gesture handling
    - Test modal zoom behavior
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [ ] 6. Update existing catalog components
  - [ ] 6.1 Enhance CatalogProductCard for multiple images
    - Add multiple images indicator (e.g., "1/4")
    - Implement hover preview for additional images (desktop)
    - Maintain backward compatibility with single image products
    - _Requirements: 2.1, 2.2, 4.5_

  - [ ] 6.2 Update product detail modal
    - Integrate ProductImageGallery component
    - Replace single image display with gallery
    - Add image sharing functionality for specific images
    - _Requirements: 2.1, 2.2, 2.3, 4.4_

  - [ ] 6.3 Implement lazy loading optimization
    - Add intersection observer for image loading
    - Implement progressive image loading in catalog
    - Optimize initial page load performance
    - _Requirements: 4.1, 4.2_

- [ ] 7. Update product management forms
  - [ ] 7.1 Integrate MultiImageUpload in product creation
    - Add MultiImageUpload component to new product form
    - Update form validation to handle multiple images
    - Implement form submission with image data
    - _Requirements: 1.1, 1.2, 1.3_



  - [ ] 7.2 Enhance product editing interface
    - Show existing images in MultiImageUpload component
    - Enable editing and reordering of existing images
    - Implement partial updates without affecting other images


    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 7.3 Add form integration tests
    - Test product creation with multiple images
    - Verify product editing preserves existing images
    - Test form validation with image constraints
    - _Requirements: 1.1, 3.1, 3.2_

- [ ] 8. Implement data migration and compatibility
  - [ ] 8.1 Create migration utility for existing products
    - Build script to convert single imageUrl to images array
    - Preserve existing image data during migration
    - Add rollback capability for migration
    - _Requirements: 4.5_

  - [ ] 8.2 Add backward compatibility helpers
    - Create utility functions to get primary image URL
    - Implement fallback logic for products without images array
    - Ensure existing sharing functionality continues working
    - _Requirements: 4.4, 4.5_

  - [ ] 8.3 Update database queries and aggregations
    - Optimize product queries to include images efficiently
    - Update search and filtering to work with new structure
    - Implement proper indexing for image-related queries
    - _Requirements: 4.1, 4.5_

- [ ] 9. Performance optimization and testing
  - [ ] 9.1 Implement image caching strategies
    - Add browser cache headers for optimized loading



    - Implement service worker caching for viewed images
    - Create CDN integration for global image distribution
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 9.2 Add performance monitoring
    - Implement image load time tracking
    - Add memory usage monitoring for gallery components
    - Create performance metrics dashboard
    - _Requirements: 4.1, 4.2_

  - [ ]* 9.3 Conduct end-to-end testing
    - Test complete workflow from upload to display
    - Verify mobile responsiveness and touch interactions
    - Test performance under various network conditions
    - _Requirements: 2.4, 4.1, 4.2_

- [ ] 10. Final integration and deployment
  - [ ] 10.1 Update sharing functionality
    - Modify product sharing to use primary image
    - Add option to share specific images from gallery
    - Update WhatsApp and social media sharing integration
    - _Requirements: 4.4_

  - [ ] 10.2 Add admin documentation and help
    - Create user guide for multiple image management
    - Add tooltips and help text in admin interface
    - Document best practices for image optimization
    - _Requirements: 1.1, 3.1_

  - [ ] 10.3 Deploy and monitor
    - Deploy changes with feature flags for gradual rollout
    - Monitor system performance and user adoption
    - Collect feedback and iterate on user experience
    - _Requirements: 4.1, 4.2_