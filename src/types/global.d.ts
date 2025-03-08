interface Window {
  twttr: {
    widgets: {
      load: (element?: HTMLElement) => void;
      createTweet: (
        tweetId: string,
        element: HTMLElement,
        options?: any
      ) => Promise<void>;
    };
  };
}