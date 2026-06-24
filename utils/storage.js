export const getStorage = (key, defaultValue = null) => {
    return new Promise((resolve) => {
        uni.getStorage({
            key,
            success: (res) => resolve(res.data ?? defaultValue),
            fail: () => resolve(defaultValue),
        });
    });
};

export const setStorage = (key, data) => {
    return new Promise((resolve, reject) => {
        uni.setStorage({
            key,
            data,
            success: () => resolve(),
            fail: (err) => reject(err),
        });
    });
};

export const removeStorage = (key) => {
    return new Promise((resolve, reject) => {
        uni.removeStorage({
            key,
            success: () => resolve(),
            fail: (err) => reject(err),
        });
    });
};
