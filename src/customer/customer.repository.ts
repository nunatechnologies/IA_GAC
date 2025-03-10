import { DataSource, Repository } from 'typeorm';
import { Customer } from './customer.entity';

export class CustomerRepository extends Repository<Customer> {
  constructor(private dataSource: DataSource) {
    super(Customer, dataSource.createEntityManager());
  }

  async findByEmail(email: string): Promise<Customer | undefined> {
    return this.findOne({ where: { email } });
  }
}
