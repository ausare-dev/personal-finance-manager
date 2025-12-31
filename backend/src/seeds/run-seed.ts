import { DataSource } from 'typeorm';
import dataSource from '../../data-source';
import { seedDatabase } from './initial-seed';
import { seedEducation } from './education-seed';

async function runSeed() {
  try {
    await dataSource.initialize();
    console.log('Database connection established');

    await seedDatabase(dataSource);
    await seedEducation(dataSource);

    await dataSource.destroy();
    console.log('Seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error running seed:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

runSeed();

