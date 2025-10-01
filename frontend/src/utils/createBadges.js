import React from 'react'
import disectMatchData from './dissectMatchData';

export async function createBadges() {
    const badges = await disectMatchData();
}
