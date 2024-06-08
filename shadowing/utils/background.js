const imageUrls = [
  '/rung.jpg',
  '/window.jpg',
  '/anime-style-clouds.jpg',
  '/beautiful-mountains-landscape.jpg',
  '/beautiful-mountains-landscape-pink.jpg',
];

const TEN_MINUTES = 10 * 60 * 1000; // 10 minutes in milliseconds

export const getNextImage = () => {
  if (typeof window !== 'undefined') {
    const currentIndex = parseInt(localStorage.getItem('backgroundIndex')) || 0;
    const lastUpdate = parseInt(localStorage.getItem('backgroundLastUpdate')) || 0;
    const now = Date.now();
    console.log(now - lastUpdate)
    if (now - lastUpdate < TEN_MINUTES) {
      return imageUrls[currentIndex];
    } else {
      const nextIndex = (currentIndex + 1) % imageUrls.length;
      localStorage.setItem('backgroundIndex', nextIndex.toString());
      localStorage.setItem('backgroundLastUpdate', now.toString());
      return imageUrls[nextIndex];
    }
  } else {
    return imageUrls[0]; // Default image for server-side rendering
  }
};
