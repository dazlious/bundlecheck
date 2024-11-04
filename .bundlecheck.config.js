import path from 'path';

const __dirname = import.meta.dirname;

export default {
  relativeTo: path.resolve(__dirname),
  cwd: 'src',
  observe: [],
}