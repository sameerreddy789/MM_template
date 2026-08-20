const debouncedHandler = (callback: () => void, period: number) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    return () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            callback();
        }, period);
    };
}

export default debouncedHandler;